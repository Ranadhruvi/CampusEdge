const express = require('express');
const router = express.Router();
const pool = require('./db');
const bcrypt = require('bcrypt');
const { authenticateToken, requireAdmin } = require('./middleware/authMiddleware');

// ==========================================
// GET ALL REGISTERED STUDENTS (Protected: Admin Only)
// ==========================================
router.get('/admin/students', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, dob, hometown, address, role, created_at FROM users WHERE LOWER(role) = 'student' ORDER BY id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch Students Error:", err.message);
    res.status(500).json({ message: "Server error fetching student roster." });
  }
});

// ==========================================
// UPDATE PROFILE (Protected: Self or Admin)
// ==========================================
router.put('/update-profile', authenticateToken, async (req, res) => {
  const { email, name, dob, hometown, address, currentPassword, newPassword } = req.body;
  try {
    // Only allow updating own profile unless admin
    if (req.user.email !== email && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized to update this profile." });
    }

    const userCheck = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = userCheck.rows[0];

    // Optional: Update password if provided
    if (newPassword && newPassword.trim() !== "") {
      if (user.password !== 'GOOGLE_AUTH_USER') {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: "Incorrect current password." });
        }
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      await pool.query(
        `UPDATE users SET name = COALESCE($1, name), dob = COALESCE($2, dob), hometown = COALESCE($3, hometown), address = COALESCE($4, address), password = $5 WHERE email = $6`,
        [name, dob || null, hometown || null, address || null, hashedNewPassword, email]
      );
    } else {
      await pool.query(
        `UPDATE users SET name = COALESCE($1, name), dob = COALESCE($2, dob), hometown = COALESCE($3, hometown), address = COALESCE($4, address) WHERE email = $5`,
        [name, dob || null, hometown || null, address || null, email]
      );
    }

    const updatedUser = await pool.query(
      `SELECT id, name, email, dob, hometown, address, role FROM users WHERE email = $1`,
      [email]
    );

    res.json({ message: "Profile updated successfully!", user: updatedUser.rows[0] });
  } catch (err) {
    console.error("Profile Update Error:", err.message);
    res.status(500).json({ message: "Server error updating profile." });
  }
});

// ==========================================
// DELETE STUDENT / PURGE USER (Protected: Admin Only)
// ==========================================
router.delete('/admin/students/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const userRes = await pool.query(`SELECT email, name FROM users WHERE id = $1`, [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: "Student account not found." });
    }

    const studentEmail = userRes.rows[0].email;
    const studentName = userRes.rows[0].name;

    // Clean up cascade records across all application tables
    await Promise.all([
      pool.query(`DELETE FROM test_history WHERE email = $1 OR user_email = $1`, [studentEmail]).catch(e => console.warn("Clean test_history:", e.message)),
      pool.query(`DELETE FROM interview_history WHERE email = $1`, [studentEmail]).catch(e => console.warn("Clean interview_history:", e.message)),
      pool.query(`DELETE FROM resume_history WHERE email = $1`, [studentEmail]).catch(e => console.warn("Clean resume_history:", e.message)),
      pool.query(`DELETE FROM roadmap_history WHERE email = $1`, [studentEmail]).catch(e => console.warn("Clean roadmap_history:", e.message)),
      pool.query(`DELETE FROM student_job_applications WHERE email = $1`, [studentEmail]).catch(e => console.warn("Clean student_job_applications:", e.message)),
      pool.query(`DELETE FROM company_eligibility_history WHERE email = $1`, [studentEmail]).catch(e => console.warn("Clean eligibility:", e.message))
    ]);

    await pool.query(`DELETE FROM users WHERE id = $1`, [id]);

    res.status(200).json({ 
      message: `Student account for ${studentName} (${studentEmail}) and all test records were permanently removed.`,
      deletedEmail: studentEmail
    });
  } catch (err) {
    console.error("Delete Student Error:", err.message);
    res.status(500).json({ message: "Server error deleting student." });
  }
});

// ==========================================
// PURGE ALL DEMO / TEST USERS (Protected: Admin Only)
// ==========================================
router.post('/admin/purge-test-users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const testUsersRes = await pool.query(
      `SELECT id, email, name FROM users WHERE (LOWER(email) LIKE 'test%' OR LOWER(email) LIKE 'demo%' OR LOWER(email) LIKE '%example.com') AND LOWER(role) != 'admin'`
    );

    const testUsers = testUsersRes.rows;
    for (const u of testUsers) {
      await pool.query(`DELETE FROM test_history WHERE email = $1 OR user_email = $1`, [u.email]).catch(() => {});
      await pool.query(`DELETE FROM interview_history WHERE email = $1`, [u.email]).catch(() => {});
      await pool.query(`DELETE FROM resume_history WHERE email = $1`, [u.email]).catch(() => {});
      await pool.query(`DELETE FROM roadmap_history WHERE email = $1`, [u.email]).catch(() => {});
      await pool.query(`DELETE FROM student_job_applications WHERE email = $1`, [u.email]).catch(() => {});
      await pool.query(`DELETE FROM users WHERE id = $1`, [u.id]).catch(() => {});
    }

    res.status(200).json({
      message: `Successfully purged ${testUsers.length} test accounts and associated logs.`,
      purgedCount: testUsers.length
    });
  } catch (err) {
    console.error("Purge Test Users Error:", err.message);
    res.status(500).json({ message: "Server error purging test accounts." });
  }
});

module.exports = router;