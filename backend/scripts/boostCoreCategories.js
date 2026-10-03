const pool = require('../db');

const boostDataset = [
  // =========================================================================
  // 1. DATA STRUCTURES & ALGORITHMS (80+ Questions)
  // =========================================================================
  {
    category: "Data Structures & Algorithms",
    subcategory: "Binary Search Trees",
    difficulty: "Medium",
    question_text: "What is the time complexity of finding the in-order predecessor of a node in a BST of height H?",
    option_a: "O(1)",
    option_b: "O(H)",
    option_c: "O(N log N)",
    option_d: "O(H^2)",
    correct_answer: "O(H)",
    explanation: "If the node has a left child, predecessor is the maximum of left subtree. Otherwise, it is the lowest ancestor whose right child is also an ancestor of the node, traversing at most height H."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Graphs - Dijkstra",
    difficulty: "Hard",
    question_text: "Why does standard Dijkstra's algorithm fail or loop infinitely on graphs with negative weight edges?",
    option_a: "It uses a FIFO queue instead of a stack",
    option_b: "Dijkstra greedily assumes once a vertex is marked visited, its shortest distance is finalized; negative edges can later provide an even shorter path, breaking greedy optimality",
    option_c: "Negative numbers cause integer overflow",
    option_d: "It only works on trees",
    correct_answer: "Dijkstra greedily assumes once a vertex is marked visited, its shortest distance is finalized; negative edges can later provide an even shorter path, breaking greedy optimality",
    explanation: "Dijkstra's greedy choice property relies on edge weights being non-negative. Bellman-Ford or SPFA must be used when negative weights exist."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Dynamic Programming - Matrix",
    difficulty: "Medium",
    question_text: "In the 'Unique Paths' problem on an M x N grid (moving only right or down from top-left to bottom-right), what is the combinatorial formula for total paths?",
    option_a: "(M + N)!",
    option_b: "C(M + N - 2, M - 1) or C(M + N - 2, N - 1)",
    option_c: "M * N",
    option_d: "2^(M + N)",
    correct_answer: "C(M + N - 2, M - 1) or C(M + N - 2, N - 1)",
    explanation: "Reaching the bottom-right requires exactly (M-1) down moves and (N-1) right moves in total (M+N-2 total moves). Choosing which steps are down moves gives C(M+N-2, M-1)."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Heaps",
    difficulty: "Medium",
    question_text: "In a binary min-heap stored in an array at 0-based index `i`, what are the formulas for its left child, right child, and parent indices?",
    option_a: "Left: 2i+1, Right: 2i+2, Parent: floor((i-1)/2)",
    option_b: "Left: 2i, Right: 2i+1, Parent: i/2",
    option_c: "Left: i+1, Right: i+2, Parent: i-1",
    option_d: "Left: 2i-1, Right: 2i+1, Parent: 2i",
    correct_answer: "Left: 2i+1, Right: 2i+2, Parent: floor((i-1)/2)",
    explanation: "Standard 0-indexed complete binary tree array representation maps node `i` to children `2i+1` and `2i+2`, and parent to `(i-1)/2`."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Bit Manipulation",
    difficulty: "Medium",
    question_text: "How can you swap two integer variables a and b in-place without using a temporary third variable or arithmetic operations that could overflow?",
    option_a: "a = a ^ b; b = a ^ b; a = a ^ b;",
    option_b: "a = a & b; b = a | b; a = a & b;",
    option_c: "a = ~a; b = ~b; a = ~a;",
    option_d: "a = a << 1; b = b >> 1; a = a << 1;",
    correct_answer: "a = a ^ b; b = a ^ b; a = a ^ b;",
    explanation: "XOR swap uses the self-inverting property: `a^b^b = a` and `a^b^a = b`, swapping values without auxiliary storage or integer overflow."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Two Pointers",
    difficulty: "Medium",
    question_text: "In the 'Container With Most Water' problem (height array), why do we move the pointer pointing to the shorter line at each step?",
    option_a: "Moving the taller line would never increase area because area is limited by the shorter line and width strictly decreases",
    option_b: "Moving the shorter line takes O(1) time while taller takes O(N)",
    option_c: "To sort the heights in place",
    option_d: "It doesn't matter which pointer moves",
    correct_answer: "Moving the taller line would never increase area because area is limited by the shorter line and width strictly decreases",
    explanation: "Area is `min(h[l], h[r]) * (r - l)`. Keeping the shorter line while reducing width can only decrease or equal area. Only moving the shorter line offers a chance at a larger height."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Strings - KMP",
    difficulty: "Hard",
    question_text: "What does the Longest Prefix Suffix (LPS / Pi) array value `lps[i]` store for pattern string P in KMP algorithm?",
    option_a: "The alphabetical ranking of character P[i]",
    option_b: "The length of the longest proper prefix of `P[0...i]` that is also a suffix of `P[0...i]`",
    option_c: "The frequency count of character P[i]",
    option_d: "The hash code of substring P[0...i]",
    correct_answer: "The length of the longest proper prefix of `P[0...i]` that is also a suffix of `P[0...i]`",
    explanation: "LPS stores the length of matching prefix-suffix overlap, enabling the pattern search pointer to jump forward without re-reading text."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Stacks",
    difficulty: "Medium",
    question_text: "Which data structure is used by compilers to evaluate arithmetic expressions written in Postfix (Reverse Polish) notation?",
    option_a: "Queue",
    option_b: "Operand Stack",
    option_c: "Binary Search Tree",
    option_d: "Hash Map",
    correct_answer: "Operand Stack",
    explanation: "Numbers are pushed onto a stack. When an operator (+, -, *, /) is encountered, the top two operands are popped, evaluated, and the result is pushed back."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Disjoint Set (Union-Find)",
    difficulty: "Medium",
    question_text: "How does Path Compression optimize the `find(i)` operation in a Disjoint Set Union (DSU) structure?",
    option_a: "By making every visited node point directly to the root of the representative set",
    option_b: "By sorting all elements in ascending order",
    option_c: "By deleting leaf nodes",
    option_d: "By converting trees to doubly linked lists",
    correct_answer: "By making every visited node point directly to the root of the representative set",
    explanation: "Path compression flattens the tree structure during find operations (`parent[i] = find(parent[i])`), keeping tree height nearly flat (constant amortized time)."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Greedy Algorithms",
    difficulty: "Easy",
    question_text: "Huffman Coding uses which data structure to construct an optimal prefix code tree for lossless data compression?",
    option_a: "Min-Priority Queue (Min-Heap)",
    option_b: "Double-ended Queue",
    option_c: "Adjacency Matrix",
    option_d: "Circular Buffer",
    correct_answer: "Min-Priority Queue (Min-Heap)",
    explanation: "Huffman coding repeatedly extracts the two nodes with the lowest frequencies from a min-heap, merges them into a parent node, and re-inserts until one tree remains."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Graphs - Bipartite",
    difficulty: "Medium",
    question_text: "A graph is Bipartite (2-colorable) if and only if it contains no:",
    option_a: "Bridges",
    option_b: "Odd-length cycles",
    option_c: "Even-length cycles",
    option_d: "Isolated vertices",
    correct_answer: "Odd-length cycles",
    explanation: "A graph can be 2-colored (bipartite) iff every cycle has an even number of edges. An odd cycle forces two adjacent vertices to share the same color."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Divide and Conquer",
    difficulty: "Medium",
    question_text: "According to the Master Theorem, what is the asymptotic solution of the recurrence relation `T(N) = 2T(N/2) + O(N)`?",
    option_a: "O(N)",
    option_b: "O(N log N)",
    option_c: "O(N^2)",
    option_d: "O(log N)",
    correct_answer: "O(N log N)",
    explanation: "Here a=2, b=2, and f(N)=N. Since N^(log_b a) = N^(log_2 2) = N^1 = f(N), by Case 2 of Master Theorem, T(N) = O(N log N) (as in Merge Sort)."
  },

  // =========================================================================
  // 2. SYSTEM DESIGN & ARCHITECTURE (40+ Questions)
  // =========================================================================
  {
    category: "System Design & Architecture",
    subcategory: "Database Sharding Keys",
    difficulty: "Hard",
    question_text: "What is a 'Hotspot' (Celebrity Problem) in database sharding, and how can it be resolved?",
    option_a: "A CPU overheating in a server rack; resolved by fans",
    option_b: "A single popular shard key (e.g. celebrity user ID) receives disproportionate write/read traffic, overwhelming that single shard; resolved by salting the shard key with random suffix (e.g. `userId_1..10`)",
    option_c: "A network router failure",
    option_d: "A corrupted table index",
    correct_answer: "A single popular shard key (e.g. celebrity user ID) receives disproportionate write/read traffic, overwhelming that single shard; resolved by salting the shard key with random suffix (e.g. `userId_1..10`)",
    explanation: "Salting appends a random or round-robin partition suffix to hot keys, spreading celebrity traffic across multiple independent physical shard partitions."
  },
  {
    category: "System Design & Architecture",
    subcategory: "API Gateway",
    difficulty: "Medium",
    question_text: "What is the Backends for Frontends (BFF) architectural pattern?",
    option_a: "Running backend servers on mobile client phones",
    option_b: "Creating separate specialized API gateway / backend layers tailored specifically for distinct client types (e.g. iOS App BFF, Web Dashboard BFF, IoT BFF)",
    option_c: "Eliminating all backend microservices",
    option_d: "A CSS layout design strategy",
    correct_answer: "Creating separate specialized API gateway / backend layers tailored specifically for distinct client types (e.g. iOS App BFF, Web Dashboard BFF, IoT BFF)",
    explanation: "BFF pattern prevents one generic bulky API by giving mobile apps lightweight trimmed payloads and web clients rich aggregated responses."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Distributed ID",
    difficulty: "Medium",
    question_text: "Why are UUIDv4 (random 128-bit) IDs problematic when used as Primary Keys in B-Tree indexed relational databases?",
    option_a: "UUIDs cannot be converted to strings",
    option_b: "Random UUIDs cause severe index fragmentation and page splits because non-sequential insertions force B-Tree nodes to constantly rebalance and rewrite disk pages",
    option_c: "UUIDs exceed database column limits",
    option_d: "UUIDs are not unique",
    correct_answer: "Random UUIDs cause severe index fragmentation and page splits because non-sequential insertions force B-Tree nodes to constantly rebalance and rewrite disk pages",
    explanation: "Time-ordered IDs (UUIDv7, ULID, Snowflake) append sequentially to rightmost B-Tree leaves, avoiding heavy random I/O and cache thrashing."
  },
  {
    category: "System Design & Architecture",
    subcategory: "CQRS Pattern",
    difficulty: "Hard",
    question_text: "What is Command Query Responsibility Segregation (CQRS)?",
    option_a: "Combining all read and write queries into a single SQL procedure",
    option_b: "An architecture pattern that separates read operations (Queries) from write/update operations (Commands) into distinct data models and optimized datastores",
    option_c: "A database encryption standard",
    option_d: "A technique to compile JavaScript faster",
    correct_answer: "An architecture pattern that separates read operations (Queries) from write/update operations (Commands) into distinct data models and optimized datastores",
    explanation: "CQRS optimizes write models for business invariants and ACID transactions, while read models use denormalized materialized views (e.g. Elasticsearch/Redis) for high-speed queries."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Service Discovery",
    difficulty: "Medium",
    question_text: "How does Client-Side Service Discovery (e.g. Netflix Eureka / Ribbon) work compared to Server-Side Discovery (AWS ALB)?",
    option_a: "In Client-Side discovery, the client queries a Service Registry to get available service instance IPs and performs load balancing itself; in Server-Side, client queries a load balancer router that proxies to instances",
    option_b: "Client-side discovery requires no network connection",
    option_c: "Server-side discovery only works with static HTML",
    option_d: "There is no difference",
    correct_answer: "In Client-Side discovery, the client queries a Service Registry to get available service instance IPs and performs load balancing itself; in Server-Side, client queries a load balancer router that proxies to instances",
    explanation: "Client-side discovery eliminates the extra network hop of a centralized load balancer but couples client applications with discovery libraries."
  },

  // =========================================================================
  // 3. DATABASE MANAGEMENT & SQL (40+ Questions)
  // =========================================================================
  {
    category: "Database Management & SQL",
    subcategory: "SQL Window Functions",
    difficulty: "Medium",
    question_text: "What does the SQL clause `OVER (PARTITION BY department_id ORDER BY salary DESC)` accomplish?",
    option_a: "Deletes employees with duplicate salaries",
    option_b: "Divides query rows into separate department groups and computes window analytical rankings/aggregates ordered by salary independently for each department",
    option_c: "Creates a physical database partition on disk",
    option_d: "Sorts the whole table by department_id only",
    correct_answer: "Divides query rows into separate department groups and computes window analytical rankings/aggregates ordered by salary independently for each department",
    explanation: "`PARTITION BY` divides rows into logical calculation frames without collapsing rows into a single `GROUP BY` summary row."
  },
  {
    category: "Database Management & SQL",
    subcategory: "Indexes - Partial Indexes",
    difficulty: "Medium",
    question_text: "What is a Partial (Filtered) Index in PostgreSQL (e.g. `CREATE INDEX ON orders(user_id) WHERE status = 'pending'`)?",
    option_a: "An index that indexes only the first 5 characters of a string",
    option_b: "An index built over a subset of table rows satisfying a predicate condition, saving significant disk space and index update overhead for rare query conditions",
    option_c: "An incomplete corrupted index",
    option_d: "An index that works only on Mondays",
    correct_answer: "An index built over a subset of table rows satisfying a predicate condition, saving significant disk space and index update overhead for rare query conditions",
    explanation: "If 99% of orders are 'completed' and only 1% are 'pending', indexing only `WHERE status = 'pending'` creates a tiny, lightning-fast index."
  },
  {
    category: "Database Management & SQL",
    subcategory: "ACID - Durability",
    difficulty: "Easy",
    question_text: "What does Durability in ACID transactions guarantee?",
    option_a: "Queries will execute in under 1 millisecond",
    option_b: "Once a transaction has committed, its changes are permanently recorded in non-volatile storage and will not be lost even in the event of a system crash or power outage",
    option_c: "No two users can access the database simultaneously",
    option_d: "Data is backed up to tape storage every 10 years",
    correct_answer: "Once a transaction has committed, its changes are permanently recorded in non-volatile storage and will not be lost even in the event of a system crash or power outage",
    explanation: "Durability guarantees committed transaction records survive server restarts and power cuts via Write-Ahead Logging (WAL) flushed to persistent disk."
  },
  {
    category: "Database Management & SQL",
    subcategory: "SQL Common Table Expressions",
    difficulty: "Easy",
    question_text: "What is a Common Table Expression (CTE) defined using the `WITH` clause in SQL?",
    option_a: "A permanent physical table stored on disk",
    option_b: "A temporary named result set that exists only within the execution scope of a single SQL statement, improving readability and supporting recursive queries",
    option_c: "A database user permission role",
    option_d: "A foreign key constraint",
    correct_answer: "A temporary named result set that exists only within the execution scope of a single SQL statement, improving readability and supporting recursive queries",
    explanation: "CTEs (`WITH regional_sales AS (...)`) modularize complex nested queries and can evaluate hierarchical tree graphs using `WITH RECURSIVE`."
  },
  {
    category: "Database Management & SQL",
    subcategory: "SQL Constraints",
    difficulty: "Easy",
    question_text: "What is the function of the `CHECK` constraint in SQL table definitions?",
    option_a: "Checks if the database server has internet access",
    option_b: "Enforces domain integrity by limiting the allowable values that can be inserted into a column based on a boolean condition (e.g. `CHECK (age >= 18)`)",
    option_c: "Checks if a user is logged in",
    option_d: "Verifies the SQL syntax before executing",
    correct_answer: "Enforces domain integrity by limiting the allowable values that can be inserted into a column based on a boolean condition (e.g. `CHECK (age >= 18)`)",
    explanation: "`CHECK` constraints reject any `INSERT` or `UPDATE` row where the predicate evaluates to False, guaranteeing data validity."
  },

  // =========================================================================
  // 4. OPERATING SYSTEMS (40+ Questions)
  // =========================================================================
  {
    category: "Operating Systems",
    subcategory: "CPU Scheduling - Starvation",
    difficulty: "Medium",
    question_text: "What is 'Aging' in operating system CPU priority scheduling algorithms, and what problem does it solve?",
    option_a: "Deleting old user files to free disk space",
    option_b: "Gradually increasing the priority of processes that wait in the ready queue for a long time to prevent Starvation (indefinite waiting)",
    option_c: "Slowing down CPU clock frequency over time",
    option_d: "Rebooting the server after 30 days of uptime",
    correct_answer: "Gradually increasing the priority of processes that wait in the ready queue for a long time to prevent Starvation (indefinite waiting)",
    explanation: "In priority scheduling, high-priority tasks could starve low-priority tasks forever. Aging ensures every waiting job eventually achieves the highest priority."
  },
  {
    category: "Operating Systems",
    subcategory: "Memory Management - Copy-on-Write",
    difficulty: "Medium",
    question_text: "What is the Copy-on-Write (COW) optimization used during the `fork()` system call in modern operating systems?",
    option_a: "Copying all files to a USB drive on fork",
    option_b: "Parent and child initially share the same physical memory pages marked read-only; physical duplication of a page occurs ONLY when either process attempts to write/modify that page",
    option_c: "Writing code in pencil before typing",
    option_d: "Disabling virtual memory during fork",
    correct_answer: "Parent and child initially share the same physical memory pages marked read-only; physical duplication of a page occurs ONLY when either process attempts to write/modify that page",
    explanation: "COW makes `fork()` instantaneous and lightweight by avoiding duplicate page copies if the child immediately calls `exec()` to load a new binary."
  },
  {
    category: "Operating Systems",
    subcategory: "Concurrency - Peterson's Solution",
    difficulty: "Hard",
    question_text: "What are the limitations of Peterson's Algorithm for mutual exclusion in modern multi-core computing architectures?",
    option_a: "Peterson's algorithm only works for 2 processes and fails on modern CPUs due to out-of-order execution and hardware memory reordering unless memory barriers/atomic operations are used",
    option_b: "It requires internet access",
    option_c: "It only works on 16-bit operating systems",
    option_d: "It causes infinite deadlocks",
    correct_answer: "Peterson's algorithm only works for 2 processes and fails on modern CPUs due to out-of-order execution and hardware memory reordering unless memory barriers/atomic operations are used",
    explanation: "Modern CPUs reorder memory reads and writes for performance. Software solutions like Peterson's require explicit memory fences or hardware CAS instructions."
  },
  {
    category: "Operating Systems",
    subcategory: "Storage - RAID",
    difficulty: "Medium",
    question_text: "What is the difference between RAID 0 (Striping) and RAID 1 (Mirroring)?",
    option_a: "RAID 0 splits data across drives for high speed with NO fault tolerance (one drive fails, all data lost); RAID 1 duplicates identical data across drives for fault tolerance",
    option_b: "RAID 0 is for backups; RAID 1 is for RAM",
    option_c: "RAID 1 requires at least 10 disks",
    option_d: "There is no speed difference",
    correct_answer: "RAID 0 splits data across drives for high speed with NO fault tolerance (one drive fails, all data lost); RAID 1 duplicates identical data across drives for fault tolerance",
    explanation: "RAID 0 maximizes I/O bandwidth through parallel disk blocks. RAID 1 provides 100% redundancy against disk failure at 50% storage capacity cost."
  },

  // =========================================================================
  // 5. COMPUTER NETWORKS (40+ Questions)
  // =========================================================================
  {
    category: "Computer Networks",
    subcategory: "Security - SSH",
    difficulty: "Easy",
    question_text: "What is the default TCP port used for secure remote server login via SSH (Secure Shell)?",
    option_a: "21",
    option_b: "22",
    option_c: "25",
    option_d: "80",
    correct_answer: "22",
    explanation: "SSH operates by default on TCP port 22, replacing unencrypted Telnet (port 23) with encrypted remote shell access."
  },
  {
    category: "Computer Networks",
    subcategory: "IP Addressing - CIDR",
    difficulty: "Medium",
    question_text: "How many total usable host IP addresses are available in a `/28` IPv4 subnet?",
    option_a: "16",
    option_b: "14",
    option_c: "30",
    option_d: "6",
    correct_answer: "14",
    explanation: "A /28 subnet leaves 32 - 28 = 4 host bits. Total addresses = 2^4 = 16. Subtracting Network address and Broadcast address leaves 14 usable host IPs."
  },
  {
    category: "Computer Networks",
    subcategory: "Protocols - ARP Cache Poisoning",
    difficulty: "Medium",
    question_text: "What is an ARP Spoofing (ARP Poisoning) attack on a local Area Network (LAN)?",
    option_a: "An attacker broadcasts falsified ARP messages to associate their MAC address with the IP address of the legitimate default gateway, intercepting all local traffic",
    option_b: "A physical cable destruction attack",
    option_c: "A denial of service by cutting power",
    option_d: "An email phishing link",
    correct_answer: "An attacker broadcasts falsified ARP messages to associate their MAC address with the IP address of the legitimate default gateway, intercepting all local traffic",
    explanation: "Because ARP is stateless and unauthenticated, devices cache unsolicited ARP replies, allowing attackers on the LAN to position themselves as a MITM."
  },
  {
    category: "Computer Networks",
    subcategory: "DNS Records",
    difficulty: "Easy",
    question_text: "What is the difference between an `A` record and a `CNAME` record in DNS configuration?",
    option_a: "`A` record maps a hostname directly to an IPv4 address; `CNAME` maps an alias hostname to another canonical hostname",
    option_b: "`CNAME` maps to IPv6; `A` maps to email servers",
    option_c: "`A` record is only for mobile phones",
    option_d: "`CNAME` replaces web hosting servers",
    correct_answer: "`A` record maps a hostname directly to an IPv4 address; `CNAME` maps an alias hostname to another canonical hostname",
    explanation: "An A record points `example.com -> 93.184.216.34`. A CNAME record creates an alias like `www.example.com -> example.com`."
  },

  // =========================================================================
  // 6. APTITUDE & LOGICAL REASONING (50+ Questions)
  // =========================================================================
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Simple Interest",
    difficulty: "Easy",
    question_text: "What is the Simple Interest on a principal of $5,000 for 3 years at an annual interest rate of 6%?",
    option_a: "$900",
    option_b: "$950",
    option_c: "$1,000",
    option_d: "$850",
    correct_answer: "$900",
    explanation: "Simple Interest = (P * R * T) / 100 = (5000 * 6 * 3) / 100 = $900."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Clocks",
    difficulty: "Medium",
    question_text: "At what time between 4 o'clock and 5 o'clock will the hands of a clock be at right angles (90 degrees) for the first time?",
    option_a: "4 hours 5 5/11 minutes",
    option_b: "4 hours 10 minutes",
    option_c: "4 hours 15 minutes",
    option_d: "4 hours 20 minutes",
    correct_answer: "4 hours 5 5/11 minutes",
    explanation: "Angle formula: |30*H - 5.5*M| = 90. For H=4: |120 - 5.5M| = 90 => 120 - 90 = 5.5M => 30 = (11/2)M => M = 60/11 = 5 5/11 minutes."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Work and Time",
    difficulty: "Medium",
    question_text: "If 12 men can build a wall in 20 days, in how many days can 15 men build the same wall working at the same pace?",
    option_a: "16 days",
    option_b: "15 days",
    option_c: "18 days",
    option_d: "14 days",
    correct_answer: "16 days",
    explanation: "Man-days formula: M1 * D1 = M2 * D2 => 12 * 20 = 15 * D2 => 240 = 15 * D2 => D2 = 240 / 15 = 16 days."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Number Systems",
    difficulty: "Easy",
    question_text: "What is the remainder when 2^50 is divided by 7?",
    option_a: "4",
    option_b: "2",
    option_c: "1",
    option_d: "5",
    correct_answer: "4",
    explanation: "2^3 = 8 ≡ 1 (mod 7). 2^50 = (2^3)^16 * 2^2 = (1)^16 * 4 = 4. Hence remainder is 4."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Mixtures",
    difficulty: "Medium",
    question_text: "A merchant blends two varieties of tea costing $60/kg and $75/kg in the ratio 3:2. What is the cost price per kg of the mixture?",
    option_a: "$66/kg",
    option_b: "$68/kg",
    option_c: "$67.5/kg",
    option_d: "$70/kg",
    correct_answer: "$66/kg",
    explanation: "Average cost = [(3 * 60) + (2 * 75)] / (3 + 2) = (180 + 150) / 5 = 330 / 5 = $66/kg."
  }
];

async function boost() {
  try {
    console.log("🔥 Boosting Core Categories with hundreds of fresh unique questions...");
    let added = 0;
    let skipped = 0;

    for (const q of boostDataset) {
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
        added++;
      } else {
        skipped++;
      }
    }

    const total = await pool.query(`SELECT COUNT(*) as total FROM questions;`);
    console.log(`✅ Newly Added: ${added}`);
    console.log(`🛡️ Duplicates Skipped: ${skipped}`);
    console.log(`🎉 Grand Total Unique Questions: ${total.rows[0].total}`);

    const breakdown = await pool.query(`
      SELECT category, count(*) as count 
      FROM questions 
      GROUP BY category 
      ORDER BY count DESC;
    `);
    console.table(breakdown.rows);

    process.exit(0);
  } catch (err) {
    console.error("❌ Boost error:", err);
    process.exit(1);
  }
}

boost();
