const pool = require('../db');

const bulkInterviewList = [
  // DSA (20 more)
  {
    category: "Data Structures & Algorithms",
    subcategory: "Dynamic Programming",
    difficulty: "Medium",
    question_text: "What is the recurrence relation to find the Minimum Coin Change needed to make amount A given coin denominations C?",
    option_a: "dp[A] = max(dp[A - c]) for all c in C",
    option_b: "dp[A] = min(dp[A - c] + 1) for all c in C where c <= A",
    option_c: "dp[A] = sum(dp[A - c])",
    option_d: "dp[A] = A / min(C)",
    correct_answer: "dp[A] = min(dp[A - c] + 1) for all c in C where c <= A",
    explanation: "For each sub-amount, trying every coin denomination and taking 1 + min subproblem cost yields the optimal minimal coin count."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Binary Trees",
    difficulty: "Medium",
    question_text: "What is the maximum number of nodes possible in a binary tree of height H (where root is height 0)?",
    option_a: "2^H",
    option_b: "2^(H + 1) - 1",
    option_c: "2 * H",
    option_d: "H^2",
    correct_answer: "2^(H + 1) - 1",
    explanation: "A full binary tree has 2^0 + 2^1 + ... + 2^H nodes, which is the sum of a geometric series equal to 2^(H+1) - 1."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Graphs",
    difficulty: "Hard",
    question_text: "Which algorithm finds the Strongly Connected Components (SCCs) of a directed graph in linear O(V + E) time using two DFS passes?",
    option_a: "Kosaraju's Algorithm",
    option_b: "Floyd-Warshall Algorithm",
    option_c: "Boruvka's Algorithm",
    option_d: "Johnson's Algorithm",
    correct_answer: "Kosaraju's Algorithm",
    explanation: "Kosaraju's algorithm performs a first DFS to order vertices by finish time, transposes the graph, and runs a second DFS in reverse finish order to extract SCCs."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Bitwise",
    difficulty: "Easy",
    question_text: "How can you isolate the lowest set bit (rightmost 1-bit) of a signed integer X in two's complement arithmetic?",
    option_a: "X & 1",
    option_b: "X & (-X)",
    option_c: "X | (~X)",
    option_d: "X ^ (X - 1)",
    correct_answer: "X & (-X)",
    explanation: "In two's complement, `-X = ~X + 1`. Bitwise ANDing `X & (-X)` zeros out all bits except the lowest set bit (e.g. 12 is 1100, -12 is 0100 -> result 4)."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Arrays",
    difficulty: "Easy",
    question_text: "What is the Dutch National Flag algorithm used for?",
    option_a: "Sorting an array of 3 distinct values (e.g. 0, 1, 2) in-place in a single O(N) pass with O(1) space",
    option_b: "Finding the shortest path on a flag grid",
    option_c: "Generating random permutations",
    option_d: "Calculating matrix determinants",
    correct_answer: "Sorting an array of 3 distinct values (e.g. 0, 1, 2) in-place in a single O(N) pass with O(1) space",
    explanation: "Dijkstra's Dutch National Flag algorithm uses 3 pointers (low, mid, high) to partition 0s to the left, 1s in the middle, and 2s to the right in linear time."
  },

  // System Design (15 more)
  {
    category: "System Design & Architecture",
    subcategory: "Storage Engines",
    difficulty: "Hard",
    question_text: "What is the primary advantage of Log-Structured Merge (LSM) Trees (used in Cassandra, RocksDB) over traditional B+ Trees for write-heavy workloads?",
    option_a: "LSM Trees convert random disk writes into high-speed sequential appends in memory (MemTable) and sequentially flush to SSTables on disk",
    option_b: "LSM Trees require zero RAM",
    option_c: "LSM Trees eliminate all read latency",
    option_d: "LSM Trees store data exclusively in CPU L2 cache",
    correct_answer: "LSM Trees convert random disk writes into high-speed sequential appends in memory (MemTable) and sequentially flush to SSTables on disk",
    explanation: "Sequential disk writes are orders of magnitude faster than random B-Tree page updates. Background compaction organizes SSTables for reads."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Search & Indexing",
    difficulty: "Medium",
    question_text: "What data structure is used by search engines like Elasticsearch and Apache Lucene to perform instant full-text searches?",
    option_a: "Inverted Index (mapping terms/words to the list of document IDs containing them)",
    option_b: "Singly Linked List",
    option_c: "Binary Heap",
    option_d: "Adjacency Matrix",
    correct_answer: "Inverted Index (mapping terms/words to the list of document IDs containing them)",
    explanation: "An inverted index tokenizes text and maps each word to a posting list of document references, allowing O(1) word lookups."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Distributed ID Generation",
    difficulty: "Medium",
    question_text: "How does Twitter Snowflake generate unique 64-bit distributed IDs across multiple datacenter nodes without central coordination?",
    option_a: "By querying a centralized MySQL AUTO_INCREMENT master",
    option_b: "By composing 1 bit unused + 41 bits timestamp + 10 bits machine/datacenter ID + 12 bits per-millisecond sequence counter",
    option_c: "By generating random UUIDv4 strings",
    option_d: "By hashing user email addresses",
    correct_answer: "By composing 1 bit unused + 41 bits timestamp + 10 bits machine/datacenter ID + 12 bits per-millisecond sequence counter",
    explanation: "Snowflake IDs are time-sortable (64-bit integer), unique across distributed machines, and generated locally without cross-network lock contention."
  },

  // DBMS & SQL (15 more)
  {
    category: "Database Management & SQL",
    subcategory: "Triggers",
    difficulty: "Medium",
    question_text: "What is a Database Trigger in SQL?",
    option_a: "A stored procedural routine that automatically executes in response to specified database events (such as INSERT, UPDATE, or DELETE) on a table",
    option_b: "A physical button on a database server",
    option_c: "An error message thrown when the hard drive is full",
    option_d: "A temporary index created during server boot",
    correct_answer: "A stored procedural routine that automatically executes in response to specified database events (such as INSERT, UPDATE, or DELETE) on a table",
    explanation: "Triggers enforce audit logging, data synchronization, and business invariant validation automatically within the database layer."
  },
  {
    category: "Database Management & SQL",
    subcategory: "SQL Aggregation",
    difficulty: "Easy",
    question_text: "Which SQL aggregate function computes the statistical average value of a numeric column, ignoring NULL values?",
    option_a: "MEDIAN()",
    option_b: "AVG()",
    option_c: "MEAN()",
    option_d: "SUM_DIV()",
    correct_answer: "AVG()",
    explanation: "`SELECT AVG(salary) FROM employees;` calculates the arithmetic mean of all non-null values in the specified column."
  },

  // Operating Systems (15 more)
  {
    category: "Operating Systems",
    subcategory: "Storage Management",
    difficulty: "Medium",
    question_text: "What is the difference between Internal and External Memory Fragmentation?",
    option_a: "Internal occurs inside SSDs; external occurs in RAM",
    option_b: "Internal fragmentation occurs when allocated memory blocks are larger than requested data (wasted space within block); External occurs when free memory is divided into small scattered non-contiguous holes",
    option_c: "External fragmentation causes CPU overheating",
    option_d: "There is no difference",
    correct_answer: "Internal fragmentation occurs when allocated memory blocks are larger than requested data (wasted space within block); External occurs when free memory is divided into small scattered non-contiguous holes",
    explanation: "Fixed-size paging suffers from internal fragmentation on last pages; variable segmentation suffers from external fragmentation requiring compaction."
  },
  {
    category: "Operating Systems",
    subcategory: "Kernel Modes",
    difficulty: "Easy",
    question_text: "What is the purpose of Dual-Mode CPU execution (User Mode vs Kernel/Supervisor Mode)?",
    option_a: "To run two games simultaneously",
    option_b: "To protect the operating system kernel and hardware from unauthorized or faulty user applications by restricting direct access to privileged instructions and memory",
    option_c: "To save battery power on laptops",
    option_d: "To enable dual-monitor display output",
    correct_answer: "To protect the operating system kernel and hardware from unauthorized or faulty user applications by restricting direct access to privileged instructions and memory",
    explanation: "User applications run in Ring 3 (User Mode) with restricted instructions. Transitions to Ring 0 (Kernel Mode) occur securely via system calls and hardware interrupts."
  },

  // Computer Networks (15 more)
  {
    category: "Computer Networks",
    subcategory: "DNS & Root Servers",
    difficulty: "Medium",
    question_text: "In the DNS lookup hierarchy, what is the sequence of servers queried when resolving an uncached domain (e.g. `api.github.com`)?",
    option_a: "Local DNS Resolver -> Root Nameserver ('.') -> Top-Level Domain (TLD) Nameserver ('.com') -> Authoritative Nameserver ('github.com')",
    option_b: "Directly to the destination web server IP",
    option_c: "Browser cache -> Wi-Fi router -> Google",
    option_d: "Satellite -> Modem -> ISP",
    correct_answer: "Local DNS Resolver -> Root Nameserver ('.') -> Top-Level Domain (TLD) Nameserver ('.com') -> Authoritative Nameserver ('github.com')",
    explanation: "Recursive resolution steps down from 13 root server clusters down to TLD (.com) and finally Authoritative DNS servers holding A/CNAME records."
  },
  {
    category: "Computer Networks",
    subcategory: "IPv6 vs IPv4",
    difficulty: "Easy",
    question_text: "What is the address length in bits of an IPv6 address compared to an IPv4 address?",
    option_a: "IPv4 is 16 bits; IPv6 is 32 bits",
    option_b: "IPv4 is 32 bits (4 bytes); IPv6 is 128 bits (16 bytes, providing 3.4 x 10^38 unique addresses)",
    option_c: "IPv4 is 64 bits; IPv6 is 256 bits",
    option_d: "IPv4 and IPv6 have the same length",
    correct_answer: "IPv4 is 32 bits (4 bytes); IPv6 is 128 bits (16 bytes, providing 3.4 x 10^38 unique addresses)",
    explanation: "IPv4's 32-bit space (~4.3 billion addresses) was exhausted; IPv6's 128-bit hexadecimal space ensures virtually limitless addressability."
  },

  // Aptitude & Reasoning (20 more)
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Percentages",
    difficulty: "Easy",
    question_text: "If a student scores 85 out of 100 on test 1 and 95 out of 100 on test 2, what is the percentage increase in their test score?",
    option_a: "10%",
    option_b: "11.76%",
    option_c: "12.5%",
    option_d: "15%",
    correct_answer: "11.76%",
    explanation: "Percentage Increase = [(New Score - Old Score) / Old Score] * 100 = [(95 - 85) / 85] * 100 = (10 / 85) * 100 = 11.76%."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Seating Arrangement",
    difficulty: "Medium",
    question_text: "Five friends (A, B, C, D, E) are sitting in a circle facing the center. If A is sitting between B and C, and D is sitting to the immediate right of B, who is sitting to the immediate left of C?",
    option_a: "A",
    option_b: "E",
    option_c: "D",
    option_d: "B",
    correct_answer: "A",
    explanation: "Since A is between B and C in a circle facing inward, looking at C, A is on C's immediate left and B is on A's other side."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Work and Wages",
    difficulty: "Medium",
    question_text: "A and B undertake a project for $600. A alone can do it in 6 days and B alone in 8 days. With the help of C, they finish in 3 days. What is C's share of the money?",
    option_a: "$75",
    option_b: "$100",
    option_c: "$150",
    option_d: "$200",
    correct_answer: "$75",
    explanation: "A's 3-day work = 3/6 = 1/2 ($300). B's 3-day work = 3/8 ($225). Remaining work done by C = 1 - (1/2 + 3/8) = 1 - 7/8 = 1/8. C's share = 1/8 * $600 = $75."
  },

  // Python & Backend (15 more)
  {
    category: "Python & Backend",
    subcategory: "AsyncIO",
    difficulty: "Medium",
    question_text: "What is `asyncio` in Python, and how does it achieve concurrency on a single thread?",
    option_a: "It compiles Python code into C++",
    option_b: "It uses an asynchronous event loop with coroutines (`async def` and `await`), cooperative multitasking, and non-blocking I/O multiplexing (`select`/`epoll`)",
    option_c: "It bypasses the operating system kernel entirely",
    option_d: "It executes code on GPUs only",
    correct_answer: "It uses an asynchronous event loop with coroutines (`async def` and `await`), cooperative multitasking, and non-blocking I/O multiplexing (`select`/`epoll`)",
    explanation: "Python's `asyncio` runs an event loop that yields CPU control during socket/file I/O waits, enabling thousands of concurrent network connections on 1 OS thread."
  },
  {
    category: "Python & Backend",
    subcategory: "Memory Management",
    difficulty: "Hard",
    question_text: "How does Python handle memory reclamation and cyclic references (e.g. Object A references B, and B references A)?",
    option_a: "Manual memory deallocation (`free()`)",
    option_b: "Primary Reference Counting for immediate cleanup, combined with a cyclic garbage collector that periodically detects and breaks isolated circular reference graphs",
    option_c: "By rebooting the Python process every hour",
    option_d: "Cyclic references are prohibited by Python syntax",
    correct_answer: "Primary Reference Counting for immediate cleanup, combined with a cyclic garbage collector that periodically detects and breaks isolated circular reference graphs",
    explanation: "Reference counts free objects immediately when count reaches 0. The `gc` module periodically scans container objects to eliminate isolated reference cycles."
  }
];

async function seedBulk() {
  try {
    console.log("🌱 Inserting additional bulk interview questions with zero duplicates...");
    let inserted = 0;
    let skipped = 0;

    for (const q of bulkInterviewList) {
      const exists = await pool.query(
        `SELECT id FROM questions WHERE LOWER(TRIM(question_text)) = LOWER(TRIM($1)) LIMIT 1;`,
        [q.question_text]
      );

      if (exists.rows.length === 0) {
        await pool.query(
          `INSERT INTO questions (category, subcategory, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            q.category.trim(),
            (q.subcategory || 'General').trim(),
            q.difficulty.trim(),
            q.question_text.trim(),
            q.option_a.trim(),
            q.option_b.trim(),
            q.option_c.trim(),
            q.option_d.trim(),
            q.correct_answer.trim(),
            (q.explanation || '').trim()
          ]
        );
        inserted++;
      } else {
        skipped++;
      }
    }

    const totalRes = await pool.query(`SELECT COUNT(*) as count FROM questions;`);
    console.log(`✅ Finished: Inserted ${inserted} new questions, skipped ${skipped} duplicates.`);
    console.log(`🎉 Total Grand Count in Question Bank: ${totalRes.rows[0].count}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Bulk insert error:", err);
    process.exit(1);
  }
}

seedBulk();
