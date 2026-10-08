const express = require('express');
const router = express.Router();
const pool = require('./db');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const { authenticateToken, requireAdmin, optionalAuth } = require('./middleware/authMiddleware');

// Multer configured with file extension and size validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed.'));
    }
  }
});

// Admin validation helper supporting both JWT token and master passphrase
function checkAdminPermission(req) {
  if (req.user && req.user.role === 'admin') return true;
  const adminKey = req.headers['x-admin-key'] || req.headers['x-admin-passphrase'] || req.query.adminKey || req.body?.adminSecretKey;
  const correctKey = process.env.ADMIN_SECRET_KEY || 'CampusEdge2026';
  if (adminKey && adminKey.trim() === correctKey.trim()) return true;
  return false;
}

// Normalizes question row from Excel, CSV, or JSON with flexible casing & aliases
function normalizeQuestionRow(rawRow) {
  if (!rawRow || typeof rawRow !== 'object') return null;

  // Clean and index all keys without spaces/symbols for flexible matching
  const normalized = {};
  for (let key of Object.keys(rawRow)) {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    normalized[cleanKey] = rawRow[key];
  }

  const safeStr = (v) => (v === undefined || v === null ? '' : String(v).trim());

  // Category
  const category = safeStr(
    normalized['category'] || normalized['subject'] || normalized['domain'] || normalized['module'] || rawRow['Category'] || rawRow['CATEGORY'] || 'General'
  );

  // Subcategory / Topic
  const subcategory = safeStr(
    normalized['topic'] || normalized['subcategory'] || normalized['subtopic'] || normalized['subcat'] || rawRow['Topic'] || rawRow['TOPIC'] || 'General'
  );

  // Difficulty
  let difficulty = safeStr(
    normalized['difficulty'] || normalized['level'] || rawRow['Difficulty'] || rawRow['DIFFICULTY'] || 'Medium'
  );
  if (!['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) {
    difficulty = 'Medium';
  }

  // Question Text
  const question_text = safeStr(
    normalized['question'] || normalized['questiontext'] || normalized['problem'] || normalized['prompt'] || normalized['q'] || rawRow['Question'] || rawRow['QUESTION']
  );

  // Options
  const option_a = safeStr(
    normalized['optiona'] || normalized['opta'] || normalized['option1'] || normalized['opt1'] || normalized['a'] || rawRow['Option A'] || rawRow['OPTION A'] || rawRow['option_a']
  );
  const option_b = safeStr(
    normalized['optionb'] || normalized['optb'] || normalized['option2'] || normalized['opt2'] || normalized['b'] || rawRow['Option B'] || rawRow['OPTION B'] || rawRow['option_b']
  );
  const option_c = safeStr(
    normalized['optionc'] || normalized['optc'] || normalized['option3'] || normalized['opt3'] || normalized['c'] || rawRow['Option C'] || rawRow['OPTION C'] || rawRow['option_c']
  );
  const option_d = safeStr(
    normalized['optiond'] || normalized['optd'] || normalized['option4'] || normalized['opt4'] || normalized['d'] || rawRow['Option D'] || rawRow['OPTION D'] || rawRow['option_d']
  );

  // Raw Answer
  let rawAnswer = safeStr(
    normalized['answer'] || normalized['correctanswer'] || normalized['correct'] || normalized['ans'] || normalized['key'] || rawRow['Answer'] || rawRow['ANSWER']
  );

  // Map option letter/number to option text if necessary
  let resolvedAnswer = rawAnswer;
  const ansLower = rawAnswer.toLowerCase();
  if (ansLower === 'a' || ansLower === 'option a' || ansLower === 'option_a' || ansLower === '1') {
    resolvedAnswer = option_a || rawAnswer;
  } else if (ansLower === 'b' || ansLower === 'option b' || ansLower === 'option_b' || ansLower === '2') {
    resolvedAnswer = option_b || rawAnswer;
  } else if (ansLower === 'c' || ansLower === 'option c' || ansLower === 'option_c' || ansLower === '3') {
    resolvedAnswer = option_c || rawAnswer;
  } else if (ansLower === 'd' || ansLower === 'option d' || ansLower === 'option_d' || ansLower === '4') {
    resolvedAnswer = option_d || rawAnswer;
  }

  // Explanation
  const explanation = safeStr(
    normalized['explanation'] || normalized['solution'] || normalized['reason'] || normalized['rationale'] || rawRow['Explanation'] || rawRow['EXPLANATION']
  );

  // Mandatory checks: Question, at least 2 options, and answer
  if (!question_text || !option_a || !option_b || !resolvedAnswer) {
    return null;
  }

  return {
    category: category || 'General',
    subcategory: subcategory || 'General',
    difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase(),
    question_text,
    option_a,
    option_b,
    option_c: option_c || '',
    option_d: option_d || '',
    correct_answer: resolvedAnswer,
    explanation: explanation || ''
  };
}

// ==========================================
// BULK UPLOAD EXCEL / CSV QUESTIONS (Admin)
// ==========================================
router.post('/bulk-upload', optionalAuth, (req, res) => {
  upload.single('excelFile')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'File upload error.' });
    }
    try {
      if (!checkAdminPermission(req)) {
        return res.status(403).json({ message: 'Forbidden: Administrator privileges required to upload questions.' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file received. Please select an Excel (.xlsx, .xls) or CSV file.' });
      }

      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return res.status(400).json({ message: 'The uploaded spreadsheet contains no sheets.' });
      }

      // Collect rows across all sheets (or sheet with data)
      let allRows = [];
      for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
        if (rows && rows.length > 0) {
          allRows = allRows.concat(rows);
        }
      }

      if (allRows.length === 0) {
        return res.status(400).json({ message: 'Spreadsheet is empty or contains no data rows.' });
      }

      let count = 0;
      let skipped = 0;
      const categoriesFound = new Set();

      for (let rawRow of allRows) {
        const parsed = normalizeQuestionRow(rawRow);
        if (parsed) {
          await pool.query(
            `INSERT INTO questions (category, subcategory, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              parsed.category,
              parsed.subcategory,
              parsed.difficulty,
              parsed.question_text,
              parsed.option_a,
              parsed.option_b,
              parsed.option_c,
              parsed.option_d,
              parsed.correct_answer,
              parsed.explanation
            ]
          );
          categoriesFound.add(parsed.category);
          count++;
        } else {
          skipped++;
        }
      }

      if (count === 0) {
        return res.status(400).json({
          message: `0 questions imported from ${allRows.length} rows. Please verify your file columns include: Question, Option A, Option B, and Answer.`,
          totalRows: allRows.length,
          skipped
        });
      }

      res.json({
        message: `✅ Successfully imported ${count} question(s) across ${categoriesFound.size} category(s)!${skipped > 0 ? ` (${skipped} incomplete rows skipped)` : ''}`,
        count,
        skipped,
        categories: Array.from(categoriesFound)
      });
    } catch (err) {
      console.error("Bulk Upload Error:", err.message);
      res.status(500).json({ message: `Server error during bulk upload: ${err.message}` });
    }
  });
});

// ==========================================
// ADD SINGLE QUESTION (Admin)
// ==========================================
router.post('/', optionalAuth, async (req, res) => {
  try {
    if (!checkAdminPermission(req)) {
      return res.status(403).json({ message: 'Forbidden: Administrator privileges required.' });
    }

    const parsed = normalizeQuestionRow(req.body);
    if (!parsed) {
      return res.status(400).json({
        message: 'Question Text, Option A, Option B, and Correct Answer are required.'
      });
    }

    const result = await pool.query(
      `INSERT INTO questions (category, subcategory, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        parsed.category,
        parsed.subcategory,
        parsed.difficulty,
        parsed.question_text,
        parsed.option_a,
        parsed.option_b,
        parsed.option_c,
        parsed.option_d,
        parsed.correct_answer,
        parsed.explanation
      ]
    );

    res.status(201).json({
      message: `✅ Question successfully added to '${parsed.category}'!`,
      question: result.rows[0]
    });
  } catch (err) {
    console.error('Single Question Add Error:', err.message);
    res.status(500).json({ message: `Server error adding question: ${err.message}` });
  }
});

// Alias for add single question
router.post('/add', optionalAuth, async (req, res) => {
  try {
    if (!checkAdminPermission(req)) {
      return res.status(403).json({ message: 'Forbidden: Administrator privileges required.' });
    }

    const parsed = normalizeQuestionRow(req.body);
    if (!parsed) {
      return res.status(400).json({
        message: 'Question Text, Option A, Option B, and Correct Answer are required.'
      });
    }

    const result = await pool.query(
      `INSERT INTO questions (category, subcategory, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        parsed.category,
        parsed.subcategory,
        parsed.difficulty,
        parsed.question_text,
        parsed.option_a,
        parsed.option_b,
        parsed.option_c,
        parsed.option_d,
        parsed.correct_answer,
        parsed.explanation
      ]
    );

    res.status(201).json({
      message: `✅ Question successfully added to '${parsed.category}'!`,
      question: result.rows[0]
    });
  } catch (err) {
    console.error('Single Question Add Error:', err.message);
    res.status(500).json({ message: `Server error adding question: ${err.message}` });
  }
});

// ==========================================
// BULK JSON ARRAY IMPORT (Admin)
// ==========================================
router.post('/bulk-json', optionalAuth, async (req, res) => {
  try {
    if (!checkAdminPermission(req)) {
      return res.status(403).json({ message: 'Forbidden: Administrator privileges required.' });
    }

    const rawList = Array.isArray(req.body) ? req.body : (req.body.questions || []);
    if (!Array.isArray(rawList) || rawList.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of questions in the request body.' });
    }

    let count = 0;
    let skipped = 0;
    const categoriesFound = new Set();

    for (const item of rawList) {
      const parsed = normalizeQuestionRow(item);
      if (parsed) {
        await pool.query(
          `INSERT INTO questions (category, subcategory, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            parsed.category,
            parsed.subcategory,
            parsed.difficulty,
            parsed.question_text,
            parsed.option_a,
            parsed.option_b,
            parsed.option_c,
            parsed.option_d,
            parsed.correct_answer,
            parsed.explanation
          ]
        );
        categoriesFound.add(parsed.category);
        count++;
      } else {
        skipped++;
      }
    }

    res.json({
      message: `✅ Successfully imported ${count} questions!${skipped > 0 ? ` (${skipped} skipped)` : ''}`,
      count,
      skipped,
      categories: Array.from(categoriesFound)
    });
  } catch (err) {
    console.error('Bulk JSON Import Error:', err.message);
    res.status(500).json({ message: `Server error importing questions: ${err.message}` });
  }
});

// Category Alias Map
const CATEGORY_ALIASES = {
  'dbms': 'Database Management & SQL',
  'sql': 'Database Management & SQL',
  'database': 'Database Management & SQL',
  'database management': 'Database Management & SQL',
  'dsa': 'Data Structures & Algorithms',
  'data structures': 'Data Structures & Algorithms',
  'algorithms': 'Data Structures & Algorithms',
  'os': 'Operating Systems',
  'operating system': 'Operating Systems',
  'operating systems': 'Operating Systems',
  'cn': 'Computer Networks',
  'computer network': 'Computer Networks',
  'computer networks': 'Computer Networks',
  'networking': 'Computer Networks',
  'networks': 'Computer Networks',
  'aptitude': 'Aptitude & Logical Reasoning',
  'logical reasoning': 'Aptitude & Logical Reasoning',
  'reasoning': 'Aptitude & Logical Reasoning',
  'react': 'React & Modern Frontend',
  'frontend': 'React & Modern Frontend',
  'react & modern frontend': 'React & Modern Frontend',
  'oop': 'OOP & Design Patterns',
  'oops': 'OOP & Design Patterns',
  'design patterns': 'OOP & Design Patterns',
  'python': 'Python',
  'python core': 'Python',
  'python & backend': 'Python & Backend',
  'python backend': 'Python & Backend',
  'backend': 'Python & Backend',
  'system design': 'System Design & Architecture',
  'system design & architecture': 'System Design & Architecture',
  'cyber': 'Cyber Security & Auth',
  'cyber security': 'Cyber Security & Auth',
  'cyber security & auth': 'Cyber Security & Auth',
  'security': 'Cyber Security & Auth',
  'cloud': 'Cloud & DevOps',
  'devops': 'Cloud & DevOps',
  'cloud & devops': 'Cloud & DevOps',
  'ml': 'Machine Learning & AI',
  'ai': 'Machine Learning & AI',
  'machine learning': 'Machine Learning & AI',
  'machine learning & ai': 'Machine Learning & AI',
  'c++': 'C++ & Low Level Systems',
  'cpp': 'C++ & Low Level Systems',
  'c++ & low level systems': 'C++ & Low Level Systems',
  'html': 'HTML',
  'html & web basics': 'HTML',
  'web basics': 'HTML',
  'java': 'Java',
  'core java': 'Java',
  'javascript': 'JavaScript',
  'js': 'JavaScript'
};

// ==========================================
// 1. GET MOCK TEST QUESTIONS FROM POSTGRESQL
// ==========================================
router.get('/mock-test', optionalAuth, async (req, res) => {
  try {
    const rawCategory = (req.query.category || 'JavaScript').trim();
    const normalizedKey = rawCategory.toLowerCase();
    const resolvedCategory = CATEGORY_ALIASES[normalizedKey] || rawCategory;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const rawDifficulty = (req.query.difficulty || 'all').trim().toLowerCase();
    const excludeIdsStr = req.query.excludeIds || '';
    const excludeIds = excludeIdsStr ? excludeIdsStr.split(',').map(id => parseInt(id, 10)).filter(n => !isNaN(n)) : [];

    // 1. First attempt: Strict category + difficulty + excludeIds
    let query = `
      SELECT 
        id, category, subcategory, difficulty, question_text, 
        option_a, option_b, option_c, option_d, 
        correct_answer, explanation 
      FROM questions 
      WHERE (LOWER(TRIM(category)) = LOWER(TRIM($1)) 
         OR LOWER(TRIM(category)) = LOWER(TRIM($2))
         OR LOWER(category) LIKE LOWER('%' || $1 || '%'))
    `;
    let params = [rawCategory, resolvedCategory];
    let paramIdx = 3;

    if (rawDifficulty && rawDifficulty !== 'all') {
      query += ` AND LOWER(TRIM(difficulty)) = LOWER(TRIM($${paramIdx}))`;
      params.push(rawDifficulty);
      paramIdx++;
    }

    if (excludeIds.length > 0) {
      query += ` AND id != ALL($${paramIdx}::int[])`;
      params.push(excludeIds);
      paramIdx++;
    }

    query += `
      ORDER BY RANDOM() 
      LIMIT $${paramIdx};
    `;
    params.push(limit);
    
    let dbResult = await pool.query(query, params);

    // 2. Second attempt: If not enough questions, fetch from same category without excludeIds or difficulty constraint
    if (dbResult.rows.length < limit) {
      const existingIds = dbResult.rows.map(r => r.id);
      const remainingNeeded = limit - dbResult.rows.length;
      
      const fallbackQuery = `
        SELECT 
          id, category, subcategory, difficulty, question_text, 
          option_a, option_b, option_c, option_d, 
          correct_answer, explanation 
        FROM questions 
        WHERE (LOWER(TRIM(category)) = LOWER(TRIM($1)) 
           OR LOWER(TRIM(category)) = LOWER(TRIM($2))
           OR LOWER(category) LIKE LOWER('%' || $1 || '%'))
          ${existingIds.length > 0 ? `AND id != ALL($3::int[])` : ''}
        ORDER BY (CASE WHEN LOWER(TRIM(difficulty)) = LOWER(TRIM($${existingIds.length > 0 ? 4 : 3})) THEN 1 ELSE 2 END), RANDOM() 
        LIMIT $${existingIds.length > 0 ? 5 : 4};
      `;

      const fbParams = existingIds.length > 0 
        ? [rawCategory, resolvedCategory, existingIds, rawDifficulty, remainingNeeded]
        : [rawCategory, resolvedCategory, rawDifficulty, remainingNeeded];

      const fbResult = await pool.query(fallbackQuery, fbParams);
      dbResult = { rows: [...dbResult.rows, ...fbResult.rows] };
    }

    if (dbResult.rows.length === 0) {
      return res.status(404).json({ 
        message: `No questions found in the database for category: ${rawCategory}` 
      });
    }

    const formattedQuestions = dbResult.rows.map(row => {
      const optionsArray = [row.option_a, row.option_b, row.option_c, row.option_d].filter(Boolean);
      let resolvedCorrectAnswer = row.correct_answer;

      const cleanAns = (row.correct_answer || '').trim().toLowerCase();
      if (cleanAns === 'a' || cleanAns === 'option_a') resolvedCorrectAnswer = row.option_a;
      else if (cleanAns === 'b' || cleanAns === 'option_b') resolvedCorrectAnswer = row.option_b;
      else if (cleanAns === 'c' || cleanAns === 'option_c') resolvedCorrectAnswer = row.option_c;
      else if (cleanAns === 'd' || cleanAns === 'option_d') resolvedCorrectAnswer = row.option_d;

      return {
        id: row.id,
        category: row.category || resolvedCategory,
        subcategory: row.subcategory || 'GENERAL',
        difficulty: row.difficulty || 'Medium',
        question: row.question_text,
        options: optionsArray, 
        answer: resolvedCorrectAnswer, 
        explanation: row.explanation || "No explanation provided in database."
      };
    });

    res.json(formattedQuestions);
  } catch (err) {
    console.error('Database Fetch Error:', err.message);
    res.status(500).json({ message: 'Server error generating mock test.' });
  }
});

// ==========================================
// 1.1 GET PRACTICE QUESTIONS WITH EXCLUDE IDS & DIFFICULTY
// ==========================================
router.get('/practice-questions', optionalAuth, async (req, res) => {
  try {
    const rawCategory = (req.query.category || 'JavaScript').trim();
    const normalizedKey = rawCategory.toLowerCase();
    const resolvedCategory = CATEGORY_ALIASES[normalizedKey] || rawCategory;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const rawDifficulty = (req.query.difficulty || 'all').trim().toLowerCase();
    const excludeIdsStr = req.query.excludeIds || '';
    const excludeIds = excludeIdsStr ? excludeIdsStr.split(',').map(id => parseInt(id, 10)).filter(n => !isNaN(n)) : [];

    let query = `
      SELECT 
        id, category, subcategory, difficulty, question_text, 
        option_a, option_b, option_c, option_d, 
        correct_answer, explanation 
      FROM questions 
      WHERE (LOWER(TRIM(category)) = LOWER(TRIM($1)) 
         OR LOWER(TRIM(category)) = LOWER(TRIM($2))
         OR LOWER(category) LIKE LOWER('%' || $1 || '%'))
    `;
    let params = [rawCategory, resolvedCategory];
    let paramIdx = 3;

    if (rawDifficulty && rawDifficulty !== 'all') {
      query += ` AND LOWER(TRIM(difficulty)) = LOWER(TRIM($${paramIdx}))`;
      params.push(rawDifficulty);
      paramIdx++;
    }

    if (excludeIds.length > 0) {
      query += ` AND id != ALL($${paramIdx}::int[])`;
      params.push(excludeIds);
      paramIdx++;
    }

    query += `
      ORDER BY RANDOM() 
      LIMIT $${paramIdx};
    `;
    params.push(limit);

    let dbResult = await pool.query(query, params);

    // If not enough questions, fill from same category
    let isReset = false;
    if (dbResult.rows.length < limit) {
      const existingIds = dbResult.rows.map(r => r.id);
      const remainingNeeded = limit - dbResult.rows.length;

      const fallbackQuery = `
        SELECT 
          id, category, subcategory, difficulty, question_text, 
          option_a, option_b, option_c, option_d, 
          correct_answer, explanation 
        FROM questions 
        WHERE (LOWER(TRIM(category)) = LOWER(TRIM($1)) 
           OR LOWER(TRIM(category)) = LOWER(TRIM($2))
           OR LOWER(category) LIKE LOWER('%' || $1 || '%'))
          ${existingIds.length > 0 ? `AND id != ALL($3::int[])` : ''}
        ORDER BY RANDOM() 
        LIMIT $${existingIds.length > 0 ? 4 : 3};
      `;

      const fbParams = existingIds.length > 0 
        ? [rawCategory, resolvedCategory, existingIds, remainingNeeded]
        : [rawCategory, resolvedCategory, remainingNeeded];

      const fbResult = await pool.query(fallbackQuery, fbParams);
      dbResult = { rows: [...dbResult.rows, ...fbResult.rows] };
      isReset = true;
    }

    // Get total count in this category
    const countQuery = `
      SELECT COUNT(*) as total FROM questions 
      WHERE (LOWER(TRIM(category)) = LOWER(TRIM($1)) 
         OR LOWER(TRIM(category)) = LOWER(TRIM($2))
         OR LOWER(category) LIKE LOWER('%' || $1 || '%'));
    `;
    const countResult = await pool.query(countQuery, [rawCategory, resolvedCategory]);
    const totalInCategory = parseInt(countResult.rows[0]?.total || 0, 10);

    const formattedQuestions = dbResult.rows.map(row => {
      const optionsArray = [row.option_a, row.option_b, row.option_c, row.option_d].filter(Boolean);
      let resolvedCorrectAnswer = row.correct_answer;

      const cleanAns = (row.correct_answer || '').trim().toLowerCase();
      if (cleanAns === 'a' || cleanAns === 'option_a') resolvedCorrectAnswer = row.option_a;
      else if (cleanAns === 'b' || cleanAns === 'option_b') resolvedCorrectAnswer = row.option_b;
      else if (cleanAns === 'c' || cleanAns === 'option_c') resolvedCorrectAnswer = row.option_c;
      else if (cleanAns === 'd' || cleanAns === 'option_d') resolvedCorrectAnswer = row.option_d;

      return {
        id: row.id,
        category: row.category || resolvedCategory,
        subcategory: row.subcategory || 'GENERAL',
        difficulty: row.difficulty || 'Medium',
        question: row.question_text,
        options: optionsArray, 
        answer: resolvedCorrectAnswer, 
        explanation: row.explanation || "No explanation provided in database."
      };
    });

    res.json({
      questions: formattedQuestions,
      totalInCategory,
      isReset,
      remainingUnseen: Math.max(0, totalInCategory - excludeIds.length - (isReset ? 0 : formattedQuestions.length))
    });
  } catch (err) {
    console.error('Practice Fetch Error:', err.message);
    res.status(500).json({ message: 'Server error generating practice session.' });
  }
});

// ==========================================
// 2. SAVE MOCK TEST RESULT TO DATABASE (Protected)
// ==========================================
router.post('/save-result', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase().trim();
    const { category, score, total, percentage, date } = req.body;

    const query = `
      INSERT INTO mock_test_history (user_email, category, score, total, percentage, test_date)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    
    const values = [userEmail, category || 'General', score, total, percentage, date || new Date().toLocaleDateString()];
    const newRecord = await pool.query(query, values);

    res.status(201).json(newRecord.rows[0]);
  } catch (err) {
    console.error("Test History Save Error:", err.message);
    res.status(500).json({ message: "Server error saving test result." });
  }
});

// ==========================================
// 3. FETCH MOCK TEST HISTORY FOR USER (Protected)
// ==========================================
router.get('/history/:email', authenticateToken, async (req, res) => {
  try {
    const targetEmail = req.params.email ? req.params.email.toLowerCase().trim() : '';
    if (req.user.role !== 'admin' && req.user.email.toLowerCase().trim() !== targetEmail) {
      return res.status(403).json({ message: "Forbidden: You are only permitted to view your own test history." });
    }

    const history = await pool.query(
      `SELECT * FROM mock_test_history WHERE LOWER(user_email) = $1 ORDER BY id DESC`, 
      [targetEmail]
    );
    res.json(history.rows);
  } catch (err) {
    console.error("Test History Fetch Error:", err.message);
    res.status(500).json({ message: "Server error fetching test history." });
  }
});


// ==========================================
// 4. FETCH ALL MOCK TEST HISTORY FOR ADMIN
// ==========================================
router.get('/admin/all-history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const allHistory = await pool.query(
      `SELECT * FROM mock_test_history ORDER BY id DESC`
    );
    res.json(allHistory.rows);
  } catch (err) {
    console.error("Admin History Fetch Error:", err.message);
    res.status(500).json({ message: "Server error fetching all test records." });
  }
});

// ==========================================
// GET ALL QUESTIONS FOR ADMIN QUESTION BANK
// ==========================================
router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM questions ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching question bank:', err.message);
    res.status(500).json({ message: 'Server error fetching questions.' });
  }
});

// ==========================================
// DELETE SINGLE QUESTION BY ID
// ==========================================
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM questions WHERE id = $1 RETURNING id;', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Question not found.' });
    }
    res.json({ message: 'Question deleted successfully.', deletedId: id });
  } catch (err) {
    console.error('Error deleting single question:', err.message);
    res.status(500).json({ message: 'Server error deleting question.' });
  }
});

// ==========================================
// DELETE QUESTIONS BY CATEGORY
// ==========================================
router.delete('/category/:category', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { category } = req.params;
    const result = await pool.query('DELETE FROM questions WHERE category = $1 RETURNING id;', [category]);
    res.json({ message: `Successfully deleted ${result.rowCount} questions in '${category}'.`, deletedCount: result.rowCount });
  } catch (err) {
    console.error('Error deleting questions by category:', err.message);
    res.status(500).json({ message: 'Server error deleting questions by category.' });
  }
});

module.exports = router;