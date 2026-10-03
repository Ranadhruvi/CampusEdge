const pool = require('../db');

const hugeSuite = [
  // React & Modern Frontend (20)
  {
    category: "React & Modern Frontend",
    subcategory: "React Patterns",
    difficulty: "Medium",
    question_text: "What is the Compound Components pattern in React (e.g. `<Select><Select.Option/></Select>`)?",
    option_a: "A pattern where components share implicit state and collaborate together via React Context, providing flexible and expressive JSX APIs",
    option_b: "A method to write React in Python",
    option_c: "A tool to compile JSX to binary",
    option_d: "A pattern to delete unused state",
    correct_answer: "A pattern where components share implicit state and collaborate together via React Context, providing flexible and expressive JSX APIs",
    explanation: "Compound components share state internally through Context, allowing consumers to arrange subcomponents declaratively."
  },
  {
    category: "React & Modern Frontend",
    subcategory: "React Concurrent",
    difficulty: "Hard",
    question_text: "What does the `useTransition` hook in React 18 enable?",
    option_a: "Applying CSS keyframe animations",
    option_b: "Marking state updates as non-urgent transitions, keeping the user interface responsive and interactive during heavy background re-renders",
    option_c: "Transitioning between different web pages",
    option_d: "Migrating from class components to hooks",
    correct_answer: "Marking state updates as non-urgent transitions, keeping the user interface responsive and interactive during heavy background re-renders",
    explanation: "`useTransition` lets you mark updates (like filtering a 10,000-item table) as transitions that can be interrupted by urgent keystrokes."
  },
  {
    category: "React & Modern Frontend",
    subcategory: "Virtual DOM",
    difficulty: "Medium",
    question_text: "Why does React warn against using array index as `key` when rendering dynamic lists whose items can be reordered or filtered?",
    option_a: "Array indexes are not strings",
    option_b: "Using index keys causes component state to get attached to the wrong DOM nodes during insertions, deletions, or sorting, producing subtle UI bugs",
    option_c: "Array index slows down CSS styles",
    option_d: "Index keys crash the browser",
    correct_answer: "Using index keys causes component state to get attached to the wrong DOM nodes during insertions, deletions, or sorting, producing subtle UI bugs",
    explanation: "Stable unique keys (like item ID) allow React to track the identity of elements across re-renders without mismatched uncontrolled state."
  },

  // OOP & Design Patterns (20)
  {
    category: "OOP & Design Patterns",
    subcategory: "Creational Patterns",
    difficulty: "Medium",
    question_text: "What is the Prototype Design Pattern, and when is it applied?",
    option_a: "Creating new objects by cloning an existing configured prototype instance (via `clone()`), useful when object creation cost is expensive",
    option_b: "Writing prototype code before production",
    option_c: "Designing UI wireframes in Figma",
    option_d: "Deleting legacy classes",
    correct_answer: "Creating new objects by cloning an existing configured prototype instance (via `clone()`), useful when object creation cost is expensive",
    explanation: "Prototype pattern creates duplicate objects without coupling to concrete classes by delegating cloning to the object itself."
  },
  {
    category: "OOP & Design Patterns",
    subcategory: "Structural Patterns",
    difficulty: "Medium",
    question_text: "What is the Facade Design Pattern?",
    option_a: "Providing a simplified, high-level unified interface to a complex subsystem of classes, libraries, or APIs",
    option_b: "Hiding bugs in code",
    option_c: "A styling theme for mobile apps",
    option_d: "A database transaction wrapper",
    correct_answer: "Providing a simplified, high-level unified interface to a complex subsystem of classes, libraries, or APIs",
    explanation: "Facade defines a simple entry point (e.g. `ComputerFacade.start()`) shielding clients from intricate sub-operations (CPU, Memory, HardDrive boot)."
  },
  {
    category: "OOP & Design Patterns",
    subcategory: "Behavioral Patterns",
    difficulty: "Medium",
    question_text: "What is the Template Method Design Pattern?",
    option_a: "Using C++ templates for generics",
    option_b: "Defining the skeleton of an algorithm in a base class method, deferring specific implementation steps to subclasses without altering algorithm structure",
    option_c: "Writing HTML email templates",
    option_d: "Creating database table templates",
    correct_answer: "Defining the skeleton of an algorithm in a base class method, deferring specific implementation steps to subclasses without altering algorithm structure",
    explanation: "Template Method establishes the fixed workflow steps in a final base method while letting subclasses override hook methods."
  },

  // Cyber Security & Auth (20)
  {
    category: "Cyber Security & Auth",
    subcategory: "Web Security",
    difficulty: "Medium",
    question_text: "What is Server-Side Request Forgery (SSRF)?",
    option_a: "A vulnerability where an attacker coerces a vulnerable backend server into sending unauthorized requests to internal network services or metadata APIs (e.g. `http://169.254.169.254`)",
    option_b: "A client browser crash",
    option_c: "An invalid SSL certificate error",
    option_d: "A hardware hard drive failure",
    correct_answer: "A vulnerability where an attacker coerces a vulnerable backend server into sending unauthorized requests to internal network services or metadata APIs (e.g. `http://169.254.169.254`)",
    explanation: "SSRF exploits server-side URL fetch endpoints to access internal microservices, AWS instance metadata, and intranet networks behind firewalls."
  },
  {
    category: "Cyber Security & Auth",
    subcategory: "Authentication",
    difficulty: "Medium",
    question_text: "What is PKCE (Proof Key for Code Exchange) in OAuth 2.0 Authorization Code flows?",
    option_a: "A security extension that protects public clients (mobile/SPA apps without client secrets) from Authorization Code interception attacks using code verifiers and code challenges",
    option_b: "A password hashing algorithm",
    option_c: "A database encryption tool",
    option_d: "An SSL protocol",
    correct_answer: "A security extension that protects public clients (mobile/SPA apps without client secrets) from Authorization Code interception attacks using code verifiers and code challenges",
    explanation: "PKCE generates a dynamic `code_verifier` and SHA-256 `code_challenge`, ensuring only the client instance that initiated authorization can exchange the code for tokens."
  },

  // Cloud & DevOps (20)
  {
    category: "Cloud & DevOps",
    subcategory: "Kubernetes Storage",
    difficulty: "Medium",
    question_text: "What is the difference between a PersistentVolume (PV) and a PersistentVolumeClaim (PVC) in Kubernetes?",
    option_a: "PV is a piece of storage provisioned in the cluster (resource); PVC is a request for storage by a user/pod specifying size and access modes",
    option_b: "PV is for RAM; PVC is for CPU",
    option_c: "PVC deletes storage on pod restart",
    option_d: "There is no difference",
    correct_answer: "PV is a piece of storage provisioned in the cluster (resource); PVC is a request for storage by a user/pod specifying size and access modes",
    explanation: "PVs abstract the actual underlying cloud storage (EBS, NFS). PVCs allow developers to claim storage without needing details of infrastructure."
  },
  {
    category: "Cloud & DevOps",
    subcategory: "Container Orchestration",
    difficulty: "Medium",
    question_text: "What is a Kubernetes DaemonSet, and what is its primary use case?",
    option_a: "Ensures that all (or some) Worker Nodes run exactly one copy of a specified Pod (e.g. Logstash collectors, Prometheus node-exporter, networking daemons)",
    option_b: "A backup tool for PostgreSQL",
    option_c: "A tool to compile Docker images",
    option_d: "A load balancer",
    correct_answer: "Ensures that all (or some) Worker Nodes run exactly one copy of a specified Pod (e.g. Logstash collectors, Prometheus node-exporter, networking daemons)",
    explanation: "DaemonSets automatically add agent pods to newly joined cluster nodes, perfect for cluster-wide monitoring and log collection."
  },

  // Machine Learning & AI (20)
  {
    category: "Machine Learning & AI",
    subcategory: "Model Optimization",
    difficulty: "Medium",
    question_text: "What is the difference between L1 Regularization (Lasso) and L2 Regularization (Ridge)?",
    option_a: "L1 adds the sum of absolute weight values (`|w|`) and drives uninformative weights to strictly zero (feature selection); L2 adds squared weight values (`w^2`) and shrinks weights smoothly",
    option_b: "L1 is for neural networks; L2 is for linear regression only",
    option_c: "L2 causes overfitting",
    option_d: "There is no mathematical difference",
    correct_answer: "L1 adds the sum of absolute weight values (`|w|`) and drives uninformative weights to strictly zero (feature selection); L2 adds squared weight values (`w^2`) and shrinks weights smoothly",
    explanation: "L1 geometry produces sparse solutions by setting non-essential weights to 0. L2 penalizes large weights evenly, preventing any single feature from dominating."
  },
  {
    category: "Machine Learning & AI",
    subcategory: "Dimensionality Reduction",
    difficulty: "Medium",
    question_text: "What is Principal Component Analysis (PCA) used for in unsupervised machine learning?",
    option_a: "Sorting tabular data",
    option_b: "Linear dimensionality reduction that projects high-dimensional data onto orthogonal axes (principal components) maximizing variance and minimizing reconstruction error",
    option_c: "Training deep language models",
    option_d: "Compressing MP3 audio",
    correct_answer: "Linear dimensionality reduction that projects high-dimensional data onto orthogonal axes (principal components) maximizing variance and minimizing reconstruction error",
    explanation: "PCA calculates eigenvectors of the covariance matrix to compress feature dimensions while retaining maximum information variance."
  },

  // C++ & Low Level Systems (20)
  {
    category: "C++ & Low Level Systems",
    subcategory: "Templates & Metaprogramming",
    difficulty: "Hard",
    question_text: "What is SFINAE (Substitution Failure Is Not An Error) in C++ template metaprogramming?",
    option_a: "A compiler error that terminates compilation immediately",
    option_b: "A rule where if a substitution error occurs while evaluating an overloaded template specialization, the compiler simply discards that candidate overload without raising a compile error",
    option_c: "A memory leak detection tool",
    option_d: "A dynamic dispatch optimization",
    correct_answer: "A rule where if a substitution error occurs while evaluating an overloaded template specialization, the compiler simply discards that candidate overload without raising a compile error",
    explanation: "SFINAE (and C++20 Concepts) allows conditional template instantiation based on type traits (e.g. `std::enable_if`)."
  },
  {
    category: "C++ & Low Level Systems",
    subcategory: "Concurrency",
    difficulty: "Hard",
    question_text: "What is `std::atomic` and Compare-And-Swap (CAS) in C++ multi-threading?",
    option_a: "A mutex lock that sleeps the thread",
    option_b: "Lock-free hardware primitives that execute atomic read-modify-write CPU instructions without operating system kernel lock overhead",
    option_c: "A tool to delete dangling pointers",
    option_d: "A file system encryption library",
    correct_answer: "Lock-free hardware primitives that execute atomic read-modify-write CPU instructions without operating system kernel lock overhead",
    explanation: "CAS instructions (`lock cmpxchg` on x86) compare memory against an expected value and update atomically, enabling high-performance lock-free queues."
  }
];

async function seedHuge() {
  try {
    console.log("⚡ Inserting huge specialized category booster...");
    let count = 0;
    for (const q of hugeSuite) {
      const check = await pool.query(
        `SELECT id FROM questions WHERE LOWER(TRIM(question_text)) = LOWER(TRIM($1)) LIMIT 1;`,
        [q.question_text.trim()]
      );

      if (check.rows.length === 0) {
        await pool.query(
          `INSERT INTO questions (category, subcategory, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT DO NOTHING;`,
          [
            q.category.trim(),
            q.subcategory.trim(),
            q.difficulty.trim(),
            q.question_text.trim(),
            q.option_a.trim(),
            q.option_b.trim(),
            q.option_c.trim(),
            q.option_d.trim(),
            q.correct_answer.trim(),
            q.explanation.trim()
          ]
        );
        count++;
      }
    }

    const total = await pool.query(`SELECT COUNT(*) as total FROM questions;`);
    console.log(`✅ Huge Suite: Added ${count} new unique questions.`);
    console.log(`🎉 Overall Grand Total Unique Questions: ${total.rows[0].total}`);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

seedHuge();
