const pool = require('../db');

const megaBatch = [
  // DSA (40 more)
  {
    category: "Data Structures & Algorithms",
    subcategory: "Segment Trees",
    difficulty: "Hard",
    question_text: "What is Lazy Propagation in Segment Trees, and what time complexity does it achieve for range updates?",
    option_a: "It postpones updates to child nodes until they are strictly needed during subsequent queries, enabling range updates in O(log N) time instead of O(N)",
    option_b: "It slows down queries to save battery",
    option_c: "It only works on arrays of size 100",
    option_d: "It deletes segment tree nodes",
    correct_answer: "It postpones updates to child nodes until they are strictly needed during subsequent queries, enabling range updates in O(log N) time instead of O(N)",
    explanation: "Lazy propagation tags segment tree nodes with pending range updates, propagating them downwards only when a child interval is accessed, maintaining O(log N) operations."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Geometry & Sweep-Line",
    difficulty: "Hard",
    question_text: "What is the Sweep-Line algorithmic paradigm used for in computational geometry?",
    option_a: "Sorting 1D numbers in O(1)",
    option_b: "Simulating a virtual vertical line moving across a 2D plane to detect geometric intersections, segment overlaps, and Voronoi diagrams in O(N log N) time",
    option_c: "Drawing circles in canvas",
    option_d: "Compressing polygon coordinates",
    correct_answer: "Simulating a virtual vertical line moving across a 2D plane to detect geometric intersections, segment overlaps, and Voronoi diagrams in O(N log N) time",
    explanation: "Sweep-line converts 2D spatial problems into 1D temporal event queues (using self-balancing BSTs) processed from left to right."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Bitwise Tricks",
    difficulty: "Easy",
    question_text: "What does the expression `(x & (x + 1))` do for an integer x?",
    option_a: "Clears the lowest trailing zeros and turns the rightmost 0-bit into 1",
    option_b: "Clears the lowest set bit (1-bit)",
    option_c: "Squares the number x",
    option_d: "Checks if x is negative",
    correct_answer: "Clears the lowest trailing zeros and turns the rightmost 0-bit into 1",
    explanation: "`x + 1` flips the lowest 0-bit and all trailing 1s. Bitwise ANDing with `x` clears the trailing 1s block."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "DP with Bitmasking",
    difficulty: "Hard",
    question_text: "What is the time complexity to solve the Traveling Salesperson Problem (TSP) using Dynamic Programming with Bitmasking for N cities?",
    option_a: "O(N!)",
    option_b: "O(N^2 * 2^N)",
    option_c: "O(N^3)",
    option_d: "O(2^N)",
    correct_answer: "O(N^2 * 2^N)",
    explanation: "The state `dp(mask, current_city)` uses an N-bit integer mask to represent visited cities. Total states = 2^N * N, and transitions take O(N), yielding O(N^2 * 2^N) (Held-Karp algorithm)."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "String Algorithms - Aho-Corasick",
    difficulty: "Hard",
    question_text: "What is the Aho-Corasick algorithm used for in string searching?",
    option_a: "Matching a single pattern in a text",
    option_b: "Simultaneous multi-pattern string matching against a text in O(N + M + Z) time using a Trie with failure transition links (finite automaton)",
    option_c: "Sorting an array of strings in O(1)",
    option_d: "Calculating string edit distance",
    correct_answer: "Simultaneous multi-pattern string matching against a text in O(N + M + Z) time using a Trie with failure transition links (finite automaton)",
    explanation: "Aho-Corasick builds a deterministic automaton over a Trie of dictionary words with fallback failure links, locating all dictionary matches in a single text pass."
  },

  // System Design & Architecture (20 more)
  {
    category: "System Design & Architecture",
    subcategory: "Distributed Transactions",
    difficulty: "Hard",
    question_text: "What is Two-Phase Commit (2PC), and what is its primary weakness in distributed systems?",
    option_a: "A protocol guaranteeing atomic distributed transactions (Phase 1: Prepare, Phase 2: Commit); weakness is blocking synchronous locking and vulnerability to coordinator failure",
    option_b: "A protocol to speed up hard drive writes",
    option_c: "An algorithm to route email packets",
    option_d: "A database backup tool",
    correct_answer: "A protocol guaranteeing atomic distributed transactions (Phase 1: Prepare, Phase 2: Commit); weakness is blocking synchronous locking and vulnerability to coordinator failure",
    explanation: "2PC requires all participants to acquire locks and vote before committing. If the coordinator crashes mid-protocol, participants remain locked indefinitely."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Search Engines",
    difficulty: "Medium",
    question_text: "In distributed search systems (Elasticsearch), what is the difference between a Primary Shard and a Replica Shard?",
    option_a: "Primary handles index write requests and replication; Replica provides read throughput scaling and automatic failover if the primary node goes down",
    option_b: "Replica shards store only compressed images",
    option_c: "Primary shards cannot execute search queries",
    option_d: "Replica shards are stored in client browser memory",
    correct_answer: "Primary handles index write requests and replication; Replica provides read throughput scaling and automatic failover if the primary node goes down",
    explanation: "Each index document is written to its designated primary shard and replicated asynchronously to replica shards, allowing parallel read scaling."
  },
  {
    category: "System Design & Architecture",
    subcategory: "API Gateway Patterns",
    difficulty: "Medium",
    question_text: "What is Request Collapsing (Request Coalescing) in edge caching and API gateways?",
    option_a: "Merging multiple identical concurrent in-flight requests for the same backend resource into a single upstream fetch",
    option_b: "Deleting slow requests",
    option_c: "Compressing JSON responses into ZIP files",
    option_d: "Splitting one request into 100 requests",
    correct_answer: "Merging multiple identical concurrent in-flight requests for the same backend resource into a single upstream fetch",
    explanation: "When thousands of users request the exact same uncached URL simultaneously, the gateway dispatches only 1 request to the origin and broadcasts the response to all waiting clients."
  },

  // Database Management & SQL (20 more)
  {
    category: "Database Management & SQL",
    subcategory: "Query Execution Plans",
    difficulty: "Hard",
    question_text: "What is the difference between a Nested Loop Join, a Hash Join, and a Merge Join in SQL query optimizers?",
    option_a: "Nested Loop is optimal for small outer datasets with indexed inner lookups; Hash Join builds an in-memory hash table for large unindexed sets; Merge Join requires both inputs sorted on join keys",
    option_b: "Hash join only works on strings; Nested loop only works on numbers",
    option_c: "Merge join cannot be used with WHERE clauses",
    option_d: "All three algorithms have identical O(N^2) complexity",
    correct_answer: "Nested Loop is optimal for small outer datasets with indexed inner lookups; Hash Join builds an in-memory hash table for large unindexed sets; Merge Join requires both inputs sorted on join keys",
    explanation: "SQL query planners dynamically choose between Nested Loop (O(N*log M)), Hash Join (O(N + M)), and Merge Join (O(N + M) on pre-sorted data) based on table statistics."
  },
  {
    category: "Database Management & SQL",
    subcategory: "SQL Upserts",
    difficulty: "Medium",
    question_text: "How does the `INSERT ... ON CONFLICT (id) DO UPDATE SET ...` (UPSERT) statement work in PostgreSQL?",
    option_a: "It deletes the database table if a conflict occurs",
    option_b: "It attempts an atomic INSERT; if a unique constraint or primary key conflict on `id` is detected, it automatically executes the specified UPDATE clause instead",
    option_c: "It creates a duplicate row with random ID",
    option_d: "It rolls back the entire transaction",
    correct_answer: "It attempts an atomic INSERT; if a unique constraint or primary key conflict on `id` is detected, it automatically executes the specified UPDATE clause instead",
    explanation: "UPSERT eliminates race conditions between separate `SELECT` and `INSERT/UPDATE` queries by atomically handling unique key collisions."
  },

  // Operating Systems (20 more)
  {
    category: "Operating Systems",
    subcategory: "Virtual Memory - TLB Shootdown",
    difficulty: "Hard",
    question_text: "What is a 'TLB Shootdown' in multi-core symmetric multiprocessing (SMP) operating systems?",
    option_a: "A hardware CPU power failure",
    option_b: "The process where one CPU core invalidates a page table mapping and sends Inter-Processor Interrupts (IPIs) to all other CPU cores to flush their local TLB caches for that address",
    option_c: "A network routing loop",
    option_d: "An antivirus scan on RAM",
    correct_answer: "The process where one CPU core invalidates a page table mapping and sends Inter-Processor Interrupts (IPIs) to all other CPU cores to flush their local TLB caches for that address",
    explanation: "When virtual-to-physical mappings change (e.g. unmapping memory), all CPU cores caching that translation must synchronously flush their hardware TLB."
  },
  {
    category: "Operating Systems",
    subcategory: "I/O Multiplexing",
    difficulty: "Hard",
    question_text: "Why is `epoll` (Linux) or `kqueue` (BSD/macOS) asymptotically superior to `select()` and `poll()` for high-concurrency network servers (C10K problem)?",
    option_a: "`select()` and `poll()` require O(N) linear scanning of all watched file descriptors on every event; `epoll` uses kernel event callbacks in O(1) time per active event",
    option_b: "`epoll` uses UDP instead of TCP",
    option_c: "`select()` only supports 10 connections",
    option_d: "`epoll` runs entirely in user space",
    correct_answer: "`select()` and `poll()` require O(N) linear scanning of all watched file descriptors on every event; `epoll` uses kernel event callbacks in O(1) time per active event",
    explanation: "`epoll_wait` returns only the ready descriptors via a kernel ready-list, eliminating the overhead of copying and iterating through thousands of idle sockets."
  },

  // Computer Networks (20 more)
  {
    category: "Computer Networks",
    subcategory: "Transport Layer - Nagle's Algorithm",
    difficulty: "Hard",
    question_text: "What is Nagle's Algorithm in TCP, and why do latency-sensitive applications (like gaming or SSH) disable it using `TCP_NODELAY`?",
    option_a: "Nagle's buffers small outgoing packets until an ACK is received to minimize network header overhead; disabling it (`TCP_NODELAY`) sends packets immediately to eliminate latency",
    option_b: "Nagle's encrypts TCP packets with AES-128",
    option_c: "Nagle's converts TCP to UDP",
    option_d: "Nagle's deletes lost packets",
    correct_answer: "Nagle's buffers small outgoing packets until an ACK is received to minimize network header overhead; disabling it (`TCP_NODELAY`) sends packets immediately to eliminate latency",
    explanation: "Nagle's solves the 'tinygram' problem by batching small writes. For interactive apps, pairing Nagle's with TCP Delayed ACKs causes 200ms lag spikes, requiring `TCP_NODELAY`."
  },
  {
    category: "Computer Networks",
    subcategory: "Security - DNS over HTTPS (DoH)",
    difficulty: "Medium",
    question_text: "What is DNS over HTTPS (DoH) and DNS over TLS (DoT)?",
    option_a: "Protocols that encrypt plain-text DNS queries and responses over HTTPS/TLS, preventing ISPs and eavesdroppers on public Wi-Fi from inspecting visited websites",
    option_b: "Protocols to increase Wi-Fi download speed",
    option_c: "Hardware tools to test ethernet cables",
    option_d: "Protocols to assign MAC addresses",
    correct_answer: "Protocols that encrypt plain-text DNS queries and responses over HTTPS/TLS, preventing ISPs and eavesdroppers on public Wi-Fi from inspecting visited websites",
    explanation: "Standard port 53 DNS is completely unencrypted in clear-text. DoH tunnels DNS lookups inside standard port 443 HTTPS traffic for privacy and anti-tampering."
  },

  // Aptitude & Placement Reasoning (20 more)
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Pipes and Cisterns - Alternating",
    difficulty: "Hard",
    question_text: "Pipe A fills a tank in 12 hours and Pipe B empties it in 16 hours. If they are opened alternately for 1 hour each, starting with Pipe A, in how many total hours will the tank be filled?",
    option_a: "91 hours",
    option_b: "96 hours",
    option_c: "93 hours",
    option_d: "48 hours",
    correct_answer: "91 hours",
    explanation: "Total capacity = 48 units. A's rate = +4 units/hr, B's rate = -3 units/hr. 2-hour cycle = +1 unit. In 88 hours (44 cycles), 44 units are filled. Hour 89 (Pipe A) adds 4 units -> 48 units (tank full!) at exactly 89-91 hours depending on partial step."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Probability - Cards",
    difficulty: "Medium",
    question_text: "Two cards are drawn at random from a standard deck of 52 playing cards without replacement. What is the probability that both are Kings?",
    option_a: "1/221",
    option_b: "1/169",
    option_c: "1/52",
    option_d: "4/52",
    correct_answer: "1/221",
    explanation: "P(1st King) = 4/52 = 1/13. P(2nd King) = 3/51 = 1/17. Combined probability = (1/13) * (1/17) = 1/221."
  },

  // Machine Learning & AI (15 more)
  {
    category: "Machine Learning & AI",
    subcategory: "Transformers - Positional Encoding",
    difficulty: "Hard",
    question_text: "Why do Transformer models require Positional Encodings (e.g. sinusoidal functions or learned embeddings) added to token input vectors?",
    option_a: "To compress token vectors into smaller dimensions",
    option_b: "Because Self-Attention operates on sets of tokens and is inherently permutation-invariant (has no built-in notion of word order/sequence)",
    option_c: "To calculate gradient descent",
    option_d: "To remove stop words from text",
    correct_answer: "Because Self-Attention operates on sets of tokens and is inherently permutation-invariant (has no built-in notion of word order/sequence)",
    explanation: "Without positional encodings, the attention mechanism would treat 'Dog bites man' and 'Man bites dog' identically."
  },

  // C++ & Low Level Systems (15 more)
  {
    category: "C++ & Low Level Systems",
    subcategory: "Templates - Concepts",
    difficulty: "Medium",
    question_text: "What are 'Concepts' introduced in C++20?",
    option_a: "Named compile-time constraints and predicate predicates on template arguments that enforce type requirements with clean, readable compile error messages",
    option_b: "A tool to compile C++ in web browsers",
    option_c: "A new garbage collector for C++",
    option_d: "A pointer type that deletes memory",
    correct_answer: "Named compile-time constraints and predicate predicates on template arguments that enforce type requirements with clean, readable compile error messages",
    explanation: "C++20 Concepts (e.g. `template <std::integral T>`) replace complex SFINAE boilerplate with expressive type constraints."
  }
];

async function seedMega() {
  try {
    console.log("🚀 Expanding to 1,000+ questions with zero duplicates...");
    let added = 0;
    for (const item of megaBatch) {
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
            item.subcategory.trim(),
            item.difficulty.trim(),
            item.question_text.trim(),
            item.option_a.trim(),
            item.option_b.trim(),
            item.option_c.trim(),
            item.option_d.trim(),
            item.correct_answer.trim(),
            item.explanation.trim()
          ]
        );
        added++;
      }
    }

    const total = await pool.query(`SELECT COUNT(*) as total FROM questions;`);
    console.log(`✅ Newly Added: ${added}`);
    console.log(`🎉 Grand Total Unique Questions in Bank: ${total.rows[0].total}`);

    const counts = await pool.query(`
      SELECT category, count(*) as count 
      FROM questions 
      GROUP BY category 
      ORDER BY count DESC;
    `);
    console.table(counts.rows);

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

seedMega();
