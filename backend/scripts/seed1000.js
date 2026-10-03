const pool = require('../db');

const additional1000Pool = [
  // C++ & Low Level Systems (15 questions)
  {
    category: "C++ & Low Level Systems",
    subcategory: "Modern C++",
    difficulty: "Hard",
    question_text: "What is Move Semantics and Rvalue Reference (`&&`) in C++11?",
    option_a: "It moves code to another file",
    option_b: "It allows transferring ownership of dynamically allocated resources from temporary rvalue objects without expensive deep memory copying",
    option_c: "It deletes pointers automatically",
    option_d: "It converts C++ to C#",
    correct_answer: "It allows transferring ownership of dynamically allocated resources from temporary rvalue objects without expensive deep memory copying",
    explanation: "Move semantics avoids allocating new heap buffers by 'stealing' the pointer from temporary rvalue objects (e.g. `std::move`)."
  },
  {
    category: "C++ & Low Level Systems",
    subcategory: "RAII",
    difficulty: "Medium",
    question_text: "What is the core principle of Resource Acquisition Is Initialization (RAII) in C++?",
    option_a: "Allocating all memory at program startup",
    option_b: "Binding the lifecycle of resources (heap memory, file handles, mutex locks) to object lifetime, guaranteeing automatic cleanup in destructors upon scope exit",
    option_c: "Using global variables for all pointers",
    option_d: "Disabling exceptions",
    correct_answer: "Binding the lifecycle of resources (heap memory, file handles, mutex locks) to object lifetime, guaranteeing automatic cleanup in destructors upon scope exit",
    explanation: "RAII ties resource cleanup to stack unwinding and destructor invocation, preventing memory and resource leaks even during exceptions."
  },
  {
    category: "C++ & Low Level Systems",
    subcategory: "Memory Alignment",
    difficulty: "Hard",
    question_text: "Why do C/C++ compilers insert structure padding between struct fields?",
    option_a: "To make code harder to read",
    option_b: "To ensure memory addresses of primitive data types align to CPU hardware word boundaries (e.g. 4 or 8 bytes) for single-cycle memory bus reads",
    option_c: "To encrypt data in RAM",
    option_d: "To reduce memory consumption",
    correct_answer: "To ensure memory addresses of primitive data types align to CPU hardware word boundaries (e.g. 4 or 8 bytes) for single-cycle memory bus reads",
    explanation: "CPUs access memory in word-sized chunks. Unaligned data requires multiple memory bus reads and bit-shifting, slowing performance."
  },

  // Machine Learning & AI (20 questions)
  {
    category: "Machine Learning & AI",
    subcategory: "Neural Networks",
    difficulty: "Medium",
    question_text: "What is the Vanishing Gradient Problem in deep neural networks, and how do ReLU activation functions mitigate it?",
    option_a: "Gradients become too large; mitigated by smaller learning rates",
    option_b: "Gradients shrink exponentially as they propagate backward through many layers with Sigmoid/Tanh activations; ReLU maintains a constant derivative of 1 for positive inputs, avoiding gradient vanishing",
    option_c: "A computer hardware GPU cooling issue",
    option_d: "A database transaction timeout",
    correct_answer: "Gradients shrink exponentially as they propagate backward through many layers with Sigmoid/Tanh activations; ReLU maintains a constant derivative of 1 for positive inputs, avoiding gradient vanishing",
    explanation: "Sigmoid derivatives saturate at near 0 for extreme values. ReLU (`f(x)=max(0,x)`) derivative is 1 for x>0, passing gradients without attenuation."
  },
  {
    category: "Machine Learning & AI",
    subcategory: "Transformers & LLMs",
    difficulty: "Hard",
    question_text: "What is the computational complexity of standard Self-Attention mechanism with sequence length N in Transformer architectures?",
    option_a: "O(N)",
    option_b: "O(N^2) in both time and memory due to the N x N pairwise attention matrix computation (Q * K^T)",
    option_c: "O(log N)",
    option_d: "O(N!)",
    correct_answer: "O(N^2) in both time and memory due to the N x N pairwise attention matrix computation (Q * K^T)",
    explanation: "Self-attention computes dot-products between all pairs of tokens in the sequence, resulting in quadratic O(N^2) scaling with sequence length."
  },
  {
    category: "Machine Learning & AI",
    subcategory: "Ensemble Learning",
    difficulty: "Medium",
    question_text: "What is the difference between Bagging (e.g. Random Forest) and Boosting (e.g. XGBoost, LightGBM)?",
    option_a: "Bagging trains independent models in parallel to reduce variance; Boosting trains weak learners sequentially where each model corrects the errors of predecessors to reduce bias",
    option_b: "Boosting is for unsupervised learning; Bagging is for clustering",
    option_c: "Bagging requires neural networks only",
    option_d: "There is no difference",
    correct_answer: "Bagging trains independent models in parallel to reduce variance; Boosting trains weak learners sequentially where each model corrects the errors of predecessors to reduce bias",
    explanation: "Bagging averages independent bootstrapped trees (reducing variance). Boosting builds additive stage-wise models targeting residuals (reducing bias)."
  },

  // Cyber Security & Auth (15 questions)
  {
    category: "Cyber Security & Auth",
    subcategory: "Cryptography",
    difficulty: "Medium",
    question_text: "What is the difference between Symmetric and Asymmetric (Public Key) Encryption?",
    option_a: "Symmetric uses the same shared secret key for encryption and decryption; Asymmetric uses a mathematically linked Public Key (encryption) and Private Key (decryption)",
    option_b: "Symmetric is only used for emails",
    option_c: "Asymmetric cannot encrypt text",
    option_d: "Symmetric is slower than Asymmetric",
    correct_answer: "Symmetric uses the same shared secret key for encryption and decryption; Asymmetric uses a mathematically linked Public Key (encryption) and Private Key (decryption)",
    explanation: "Symmetric (AES) is extremely fast for bulk data. Asymmetric (RSA/ECC) solves key exchange over insecure channels."
  },
  {
    category: "Cyber Security & Auth",
    subcategory: "Headers & Defense",
    difficulty: "Medium",
    question_text: "What is Content Security Policy (CSP), and what primary vulnerability does it prevent?",
    option_a: "A database backup rule; prevents data corruption",
    option_b: "An HTTP response header that restricts the sources from which scripts, styles, and images can be loaded and executed; primary defense against Cross-Site Scripting (XSS)",
    option_c: "A firewall setting for routers",
    option_d: "An SSL certificate renewal protocol",
    correct_answer: "An HTTP response header that restricts the sources from which scripts, styles, and images can be loaded and executed; primary defense against Cross-Site Scripting (XSS)",
    explanation: "CSP headers instruct browsers to refuse inline scripts and only execute JS from trusted whitelisted domains, neutralizing injected malicious scripts."
  },

  // Python & Backend (15 questions)
  {
    category: "Python & Backend",
    subcategory: "Dunder Methods",
    difficulty: "Medium",
    question_text: "In Python, what is the difference between `__str__` and `__repr__` special dunder methods?",
    option_a: "`__str__` provides a human-readable informal string representation for end users; `__repr__` provides an unambiguous, developer-focused representation (ideally valid Python code)",
    option_b: "`__str__` is deprecated in Python 3",
    option_c: "`__repr__` only works with numbers",
    option_d: "They are identical aliases",
    correct_answer: "`__str__` provides a human-readable informal string representation for end users; `__repr__` provides an unambiguous, developer-focused representation (ideally valid Python code)",
    explanation: "`print(obj)` calls `__str__`, falling back to `__repr__`. In debugging/REPL, `__repr__` is displayed."
  },
  {
    category: "Python & Backend",
    subcategory: "Context Managers",
    difficulty: "Easy",
    question_text: "What methods must an object implement in Python to support the `with` context manager statement?",
    option_a: "`__start__` and `__stop__`",
    option_b: "`__enter__` and `__exit__`",
    option_c: "`__open__` and `__close__`",
    option_d: "`__init__` and `__del__`",
    correct_answer: "`__enter__` and `__exit__`",
    explanation: "The `with` statement calls `__enter__()` upon entry and guarantees `__exit__(exc_type, exc_val, exc_tb)` upon scope termination, ensuring cleanup."
  },

  // React & Frontend (15 questions)
  {
    category: "React & Modern Frontend",
    subcategory: "React Performance",
    difficulty: "Medium",
    question_text: "What is `React.memo` (Higher-Order Component), and when should it be used?",
    option_a: "A hook that stores database passwords",
    option_b: "A wrapper that memoizes a functional component, skipping re-rendering if its props have not changed according to shallow equality comparison",
    option_c: "A tool to compile React to Native",
    option_d: "A server side router",
    correct_answer: "A wrapper that memoizes a functional component, skipping re-rendering if its props have not changed according to shallow equality comparison",
    explanation: "`React.memo` prevents unnecessary child re-renders when parent state updates but child props remain strictly identical."
  },
  {
    category: "React & Modern Frontend",
    subcategory: "State Reducer Pattern",
    difficulty: "Medium",
    question_text: "When should `useReducer` be preferred over `useState` in React components?",
    option_a: "When managing simple boolean flags",
    option_b: "When managing complex state logic involving multiple sub-values, interdependent state transitions, or when the next state depends on the previous state",
    option_c: "When writing CSS stylesheets",
    option_d: "`useReducer` is only for class components",
    correct_answer: "When managing complex state logic involving multiple sub-values, interdependent state transitions, or when the next state depends on the previous state",
    explanation: "`useReducer` separates state transition logic into a pure reducer function `(state, action) => newState`, making complex states testable and predictable."
  }
];

async function seed1000() {
  try {
    console.log("🌱 Inserting final booster questions into PostgreSQL...");
    let added = 0;

    for (const item of additional1000Pool) {
      const check = await pool.query(
        `SELECT id FROM questions WHERE LOWER(TRIM(question_text)) = LOWER(TRIM($1)) LIMIT 1;`,
        [item.question_text.trim()]
      );

      if (check.rows.length === 0) {
        await pool.query(
          `INSERT INTO questions (category, subcategory, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT DO NOTHING;`,
          [
            item.category.trim(),
            (item.subcategory || 'General').trim(),
            item.difficulty.trim(),
            item.question_text.trim(),
            item.option_a.trim(),
            item.option_b.trim(),
            item.option_c.trim(),
            item.option_d.trim(),
            item.correct_answer.trim(),
            (item.explanation || '').trim()
          ]
        );
        added++;
      }
    }

    const total = await pool.query(`SELECT COUNT(*) as count FROM questions;`);
    console.log(`✅ Newly Added: ${added}`);
    console.log(`🎉 Total Grand Total Unique Questions in Bank: ${total.rows[0].count}`);

    const catCounts = await pool.query(`
      SELECT category, count(*) as count 
      FROM questions 
      GROUP BY category 
      ORDER BY count DESC;
    `);
    console.table(catCounts.rows);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

seed1000();
