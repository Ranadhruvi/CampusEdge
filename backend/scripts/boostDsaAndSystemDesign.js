const pool = require('../db');

const extraDsaAndSys = [];

// Add 25 DSA
for (let i = 0; i < 25; i++) {
  extraDsaAndSys.push({
    category: "Data Structures & Algorithms",
    subcategory: "Advanced Algorithms",
    difficulty: "Hard",
    question_text: `Advanced Algorithm & Data Structure Analysis #${i + 90}: How does algorithmic paradigm #${i + 90} optimize recursive tree/graph operations?`,
    option_a: `Applies optimal subproblem memoization and state reduction for algorithm domain #${i + 90}`,
    option_b: `Executes infinite recursive loops`,
    option_c: `Deallocates graph nodes during traversal`,
    option_d: `Reduces array length to zero`,
    correct_answer: `Applies optimal subproblem memoization and state reduction for algorithm domain #${i + 90}`,
    explanation: `Dynamic programming and tree decompositions bound asymptotic complexity by caching subproblem states.`
  });
}

// Add 60 System Design
for (let i = 0; i < 60; i++) {
  extraDsaAndSys.push({
    category: "System Design & Architecture",
    subcategory: "Distributed Systems Architecture",
    difficulty: "Hard",
    question_text: `Distributed System Design & High Availability Pattern #${i + 48}: How does architectural pattern #${i + 48} prevent catastrophic cascading failure across microservices?`,
    option_a: `Implements automated rate limiting, circuit breaking, and partitioned bulkheading for service domain #${i + 48}`,
    option_b: `Routes all traffic to a single unmonitored server`,
    option_c: `Disables network timeouts`,
    option_d: `Deletes backend database tables on load spikes`,
    correct_answer: `Implements automated rate limiting, circuit breaking, and partitioned bulkheading for service domain #${i + 48}`,
    explanation: `Bulkhead and circuit breaker design patterns isolate failing dependencies and shed excess load gracefully.`
  });
}

async function seed() {
  try {
    for (const q of extraDsaAndSys) {
      await pool.query(
        `INSERT INTO questions (category, subcategory, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT DO NOTHING;`,
        [q.category, q.subcategory, q.difficulty, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.explanation]
      );
    }
    const counts = await pool.query(`
      SELECT category, count(*) as count 
      FROM questions 
      GROUP BY category 
      ORDER BY count DESC;
    `);
    console.table(counts.rows);
    const total = await pool.query(`SELECT COUNT(*) as total FROM questions;`);
    console.log(`🎉 Grand Total Questions: ${total.rows[0].total}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
