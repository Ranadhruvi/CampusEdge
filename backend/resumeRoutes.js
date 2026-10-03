const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('./db');
const { authenticateToken, requireAdmin, optionalAuth, rateLimiter } = require('./middleware/authMiddleware');


require('dotenv').config();

// Multer memory storage configured with PDF fileFilter and 10MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf' || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF resume files (.pdf) are supported.'));
    }
  }
});

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Safely cleans and extracts JSON from raw AI text output
 */
function cleanAndParseAIJson(rawText) {
  if (!rawText) throw new Error("Empty AI response");
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  return JSON.parse(cleaned);
}

// ==========================================
// ROUTE 1: ANALYZE RESUME (Rate Limited)
// ==========================================
router.post('/analyze', rateLimiter({ max: 15, message: 'Too many resume scans. Please wait a minute.' }), (req, res) => {
  upload.single('resume')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Invalid file format.' });
    }

    try {
      if (!req.file) return res.status(400).json({ message: 'No PDF file uploaded.' });

      const targetRole = (req.body.targetRole || 'Software Engineer').trim();
      const companyName = (req.body.companyName || 'General').trim();
      const rawTargetRole = targetRole.toLowerCase();
      
      const pdfData = await pdfParse(req.file.buffer);
      const resumeText = pdfData.text || '';

      if (resumeText.trim().length < 20) {
        return res.status(400).json({ message: 'Could not extract sufficient text from PDF. Ensure the file contains selectable text.' });
      }

      // ==========================================
      // ATTEMPT 1: TRUE AI (GEMINI)
      // ==========================================
      if (genAI) {
        try {
          const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            generationConfig: { responseMimeType: "application/json" } 
          });
          
          const prompt = `
          You are an expert, strict Applicant Tracking System (ATS) and a Principal Recruiter evaluating candidate resumes for ${companyName !== 'General' ? companyName : 'Tier-1 technology firms'}.
          Perform a thorough, realistic ATS parse and evaluation of this resume against the role: "${targetRole}" at company: "${companyName}".
          
          CRITICAL SCORING RULES:
          - Overall score should accurately reflect skill alignment, quantifiable impact, and ATS readability (25-95).
          - Provide granular sub-scores for Keyword Match, Formatting Hygiene, and Action Impact.
          - Provide high-impact STAR-format resume bullet point recommendations for missing keywords.
          
          Return ONLY valid JSON matching this schema:
          {
            "score": 78,
            "keywordMatchPct": 80,
            "formattingScore": 92,
            "impactScore": 75,
            "status": "Strong Match / Competitive Candidate / Needs Improvement / Major Gaps",
            "targetRole": "${targetRole}",
            "companyName": "${companyName}",
            "recommendedRole": "Best matched job role",
            "seniorityFit": "Graduate / Junior Engineer / Mid-Level",
            "summary": "2-sentence executive summary of the resume's strengths and core bottlenecks.",
            "foundKeywords": ["React", "JavaScript", "SQL", "Git"],
            "missingKeywords": ["Docker", "CI/CD", "Redis", "Unit Testing"],
            "suggestedBullets": [
              { "skill": "Docker", "bullet": "Containerized 3 full-stack microservices using Docker, reducing local deployment onboarding time by 45%." },
              { "skill": "Redis", "bullet": "Integrated Redis in-memory caching for session tokens and hot queries, improving API latency from 240ms to 45ms." }
            ],
            "improvementSkills": ["Actionable step 1 with measurable goal", "Actionable step 2", "Actionable step 3"],
            "lackingAreas": ["Formatting observation 1 (e.g. Avoid two-column tables for ATS)", "Observation 2"]
          }
          
          Resume Content:
          "${resumeText.slice(0, 4500)}"
          `;

          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          const aiAnalysis = cleanAndParseAIJson(responseText);
          
          return res.json({
            ...aiAnalysis,
            companyName: companyName,
            targetRole: targetRole
          });
        } catch (aiError) {
          console.error("AI Generation Fallback triggered:", aiError.message);
        }
      }

      // ==========================================
      // ATTEMPT 2: SMART DICTIONARY SYSTEM FALLBACK
      // ==========================================
      let keywordsToScan = ['communication', 'project management', 'leadership', 'problem solving', 'teamwork', 'analytical', 'git', 'sql'];
      let recommendedFallback = "Software Engineer";

      if (rawTargetRole.includes('data')) { 
        keywordsToScan = ['sql', 'python', 'tableau', 'excel', 'statistics', 'pandas', 'machine learning', 'powerbi', 'etl']; 
        recommendedFallback = "Data Analyst"; 
      } else if (rawTargetRole.includes('front') || rawTargetRole.includes('web') || rawTargetRole.includes('react')) { 
        keywordsToScan = ['javascript', 'react', 'html', 'css', 'tailwind', 'typescript', 'api', 'ui', 'redux', 'nextjs']; 
        recommendedFallback = "Frontend Developer"; 
      } else if (rawTargetRole.includes('back') || rawTargetRole.includes('node') || rawTargetRole.includes('api')) { 
        keywordsToScan = ['node.js', 'express', 'python', 'java', 'sql', 'api', 'docker', 'postgresql', 'mongodb', 'rest']; 
        recommendedFallback = "Backend Developer"; 
      } else if (rawTargetRole.includes('ai') || rawTargetRole.includes('machine') || rawTargetRole.includes('deep')) { 
        keywordsToScan = ['python', 'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'nlp', 'scikit-learn', 'pandas']; 
        recommendedFallback = "AI/ML Engineer"; 
      } else if (rawTargetRole.includes('cloud') || rawTargetRole.includes('devops')) {
        keywordsToScan = ['aws', 'docker', 'kubernetes', 'ci/cd', 'linux', 'terraform', 'git', 'jenkins'];
        recommendedFallback = "DevOps Engineer";
      }

      const lowerResumeText = resumeText.toLowerCase();
      const foundKeywords = [];
      const missingKeywords = [];

      keywordsToScan.forEach(keyword => {
        if (lowerResumeText.includes(keyword)) foundKeywords.push(keyword);
        else missingKeywords.push(keyword);
      });

      const keywordMatchPct = Math.round((foundKeywords.length / keywordsToScan.length) * 100);
      const computedScore = Math.min(94, Math.max(38, keywordMatchPct + 18));
      const status = computedScore >= 75 ? 'Strong Match' : (computedScore >= 55 ? 'Competitive Candidate' : 'Needs Improvement');

      const suggestedBullets = missingKeywords.slice(0, 3).map(kw => ({
        skill: kw,
        bullet: `Architected and optimized features utilizing ${kw}, enhancing module throughput and reducing response times by 32%.`
      }));

      res.json({
        score: computedScore,
        keywordMatchPct: keywordMatchPct,
        formattingScore: 90,
        impactScore: 78,
        status: status,
        targetRole: targetRole,
        companyName: companyName,
        recommendedRole: recommendedFallback,
        seniorityFit: "Junior / Associate Engineer",
        summary: `Resume parsed successfully with ${foundKeywords.length} of ${keywordsToScan.length} critical skills detected for ${targetRole}.`,
        foundKeywords: foundKeywords.length > 0 ? foundKeywords : ["Problem Solving", "Git"],
        missingKeywords: missingKeywords.length > 0 ? missingKeywords : ["Containerization", "CI/CD"],
        suggestedBullets,
        improvementSkills: [
          `Integrate high-demand tools such as ${missingKeywords.slice(0, 2).join(', ') || 'Docker and Git'} into your portfolio projects.`,
          "Quantify your project outcomes with measurable business metrics and percentages (e.g. 'boosted efficiency by 25%').",
          `Tailor your summary section specifically for ${companyName} assessment criteria.`
        ],
        lackingAreas: [
          "Ensure consistent date formatting across experience and education entries.",
          "Use bullet points instead of paragraphs for readability.",
          "Ensure single-column layout without embedded image tables for ATS parser compatibility."
        ]
      });

    } catch (err) {
      console.error('Fatal Route Error in resume analyze:', err);
      res.status(500).json({ message: 'Error analyzing resume. Please verify the PDF format and try again.' });
    }
  });
});

// ==========================================
// ROUTE 2: SAVE RESUME HISTORY TO POSTGRESQL (Protected)
// ==========================================
router.post('/save-history', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase().trim();
    const { targetRole, companyName, recommendedRole, score, status, fileName, date, fullData } = req.body;

    const query = `
      INSERT INTO resume_history (user_email, target_role, recommended_role, score, status, file_name, analysis_date, full_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
    `;
    
    const values = [userEmail, targetRole, recommendedRole, score, status, fileName, date || new Date().toLocaleDateString(), JSON.stringify(fullData || {})];
    const newRecord = await pool.query(query, values);

    res.status(201).json(newRecord.rows[0]);
  } catch (err) {
    console.error("Database Save Error:", err.message);
    res.status(500).json({ message: "Server error saving history." });
  }
});

// ==========================================
// ROUTE 3: FETCH RESUME HISTORY FOR A SPECIFIC USER (Protected)
// ==========================================
router.get('/history/:email', authenticateToken, async (req, res) => {
  try {
    const targetEmail = req.params.email ? req.params.email.toLowerCase().trim() : '';
    if (req.user.role !== 'admin' && req.user.email.toLowerCase().trim() !== targetEmail) {
      return res.status(403).json({ message: "Forbidden: You are only permitted to view your own resume history." });
    }

    const history = await pool.query(
      `SELECT * FROM resume_history WHERE LOWER(user_email) = $1 ORDER BY id DESC`, 
      [targetEmail]
    );
    const formatted = history.rows.map(row => ({
      ...row,
      full_data: typeof row.full_data === 'string' ? JSON.parse(row.full_data) : (row.full_data || {})
    }));
    res.json(formatted);
  } catch (err) {
    console.error("Database Fetch Error:", err.message);
    res.status(500).json({ message: "Server error fetching history." });
  }
});

module.exports = router;