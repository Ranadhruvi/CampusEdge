const pool = require('../db');

async function cleanAndEnforceUnique() {
  try {
    console.log("🧹 Deduplicating questions table...");

    // Remove duplicates keeping the lowest id
    const deleteRes = await pool.query(`
      DELETE FROM questions a
      USING questions b
      WHERE a.id > b.id
        AND LOWER(TRIM(a.question_text)) = LOWER(TRIM(b.question_text));
    `);

    console.log(`🗑️ Removed ${deleteRes.rowCount} duplicate records from previous imports.`);

    // Add unique index on lower(trim(question_text)) to prevent any future duplicates
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_unique_text 
      ON questions (LOWER(TRIM(question_text)));
    `);
    console.log("🔒 Created UNIQUE index constraint: idx_questions_unique_text");

    const totalRes = await pool.query(`SELECT COUNT(*) as total FROM questions;`);
    console.log(`🎉 Pure Unique Questions in Bank: ${totalRes.rows[0].total}`);

    const checkDuplicates = await pool.query(`
      SELECT LOWER(TRIM(question_text)), COUNT(*) 
      FROM questions 
      GROUP BY LOWER(TRIM(question_text)) 
      HAVING COUNT(*) > 1;
    `);

    console.log(`✅ Duplicates remaining: ${checkDuplicates.rows.length} (Guaranteed Zero!)`);

    const breakdown = await pool.query(`
      SELECT category, count(*) as count 
      FROM questions 
      GROUP BY category 
      ORDER BY count DESC;
    `);
    console.log("\n📊 Final Unique Question Distribution:");
    console.table(breakdown.rows);

    process.exit(0);
  } catch (err) {
    console.error("Error during deduplication:", err);
    process.exit(1);
  }
}

cleanAndEnforceUnique();
