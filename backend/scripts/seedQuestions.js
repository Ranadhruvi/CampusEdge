const pool = require('../db');

const interviewQuestions = [
  // =========================================================================
  // 1. DATA STRUCTURES & ALGORITHMS (30 Questions)
  // =========================================================================
  {
    category: "Data Structures & Algorithms",
    subcategory: "Arrays & Two Pointers",
    difficulty: "Easy",
    question_text: "What is the time complexity of searching an element in an unsorted array of size N using linear search?",
    option_a: "O(1)",
    option_b: "O(log N)",
    option_c: "O(N)",
    option_d: "O(N^2)",
    correct_answer: "O(N)",
    explanation: "In an unsorted array, linear search must examine each element one by one in the worst case, leading to O(N) time."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Binary Search",
    difficulty: "Medium",
    question_text: "Binary search requires which of the following preconditions on the array to function correctly?",
    option_a: "Array must contain only positive numbers",
    option_b: "Array elements must be sorted in monotonic order",
    option_c: "Array size must be a power of two",
    option_d: "Array must not have any duplicate elements",
    correct_answer: "Array elements must be sorted in monotonic order",
    explanation: "Binary search operates by halving the search space at each step based on comparison with the midpoint, which requires elements to be sorted."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Linked Lists",
    difficulty: "Easy",
    question_text: "What is Floyd's Cycle Detection Algorithm (Tortoise and Hare) used for in a singly linked list?",
    option_a: "Sorting the list in O(N log N)",
    option_b: "Detecting the presence of a loop or cycle in O(N) time and O(1) space",
    option_c: "Reversing the linked list in place",
    option_d: "Finding the maximum element in the list",
    correct_answer: "Detecting the presence of a loop or cycle in O(N) time and O(1) space",
    explanation: "Floyd's algorithm uses two pointers moving at different speeds (slow by 1 step, fast by 2 steps); if a cycle exists, they are guaranteed to meet."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Stacks & Queues",
    difficulty: "Easy",
    question_text: "Which data structure follows the Last-In, First-Out (LIFO) order of element removal?",
    option_a: "Queue",
    option_b: "Heap",
    option_c: "Stack",
    option_d: "Circular Buffer",
    correct_answer: "Stack",
    explanation: "A stack is a linear LIFO structure where insertions (push) and removals (pop) take place at the same end called top."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Trees",
    difficulty: "Medium",
    question_text: "In a Binary Search Tree (BST), which tree traversal produces keys in strictly ascending sorted order?",
    option_a: "Pre-order Traversal",
    option_b: "In-order Traversal",
    option_c: "Post-order Traversal",
    option_d: "Level-order Traversal",
    correct_answer: "In-order Traversal",
    explanation: "In-order traversal visits (Left, Root, Right), which in a BST guarantees that smaller left subtree values are visited before the root and larger right subtree values."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Heaps",
    difficulty: "Medium",
    question_text: "What is the time complexity of extracting the minimum element (extract-min) from a Min-Heap of size N?",
    option_a: "O(1)",
    option_b: "O(log N)",
    option_c: "O(N)",
    option_d: "O(N log N)",
    correct_answer: "O(log N)",
    explanation: "Extracting the root takes O(1), but restoring the min-heap property by sinking/heapifying down takes O(log N)."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Hashing",
    difficulty: "Medium",
    question_text: "What is the worst-case time complexity of lookup in a Hash Table when all keys collide into the same bucket implemented as a linked list?",
    option_a: "O(1)",
    option_b: "O(log N)",
    option_c: "O(N)",
    option_d: "O(N^2)",
    correct_answer: "O(N)",
    explanation: "Under severe hash collisions without balanced tree buckets, all N items chain into a single linked list, causing worst-case lookup to degrade to O(N)."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Graphs",
    difficulty: "Medium",
    question_text: "Which graph traversal algorithm uses a FIFO Queue and is optimal for finding the shortest path in an unweighted graph?",
    option_a: "Depth First Search (DFS)",
    option_b: "Breadth First Search (BFS)",
    option_c: "Topological Sort",
    option_d: "Kruskal's Algorithm",
    correct_answer: "Breadth First Search (BFS)",
    explanation: "BFS traverses level by level, ensuring that the first time a node is reached in an unweighted graph represents the shortest path."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Dynamic Programming",
    difficulty: "Hard",
    question_text: "What are the two fundamental properties required to solve a problem using Dynamic Programming?",
    option_a: "Linear ordering and divide-and-conquer",
    option_b: "Overlapping subproblems and optimal substructure",
    option_c: "Greedy choice property and recursion",
    option_d: "State compression and bitwise operators",
    correct_answer: "Overlapping subproblems and optimal substructure",
    explanation: "Dynamic programming applies when the solution to subproblems can be reused (overlapping) and the optimal global solution is composed of optimal subproblem solutions."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Sorting",
    difficulty: "Medium",
    question_text: "Which of the following sorting algorithms is guaranteed to have O(N log N) worst-case time complexity and is stable?",
    option_a: "Quick Sort",
    option_b: "Heap Sort",
    option_c: "Merge Sort",
    option_d: "Selection Sort",
    correct_answer: "Merge Sort",
    explanation: "Merge Sort consistently divides arrays in half and merges sorted halves, guaranteeing O(N log N) time in best, average, and worst cases while preserving relative order of equal keys."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Graphs",
    difficulty: "Hard",
    question_text: "Which algorithm is used to find the shortest path from a single source node to all other nodes in a graph with non-negative edge weights?",
    option_a: "Prim's Algorithm",
    option_b: "Dijkstra's Algorithm",
    option_c: "Tarjan's Algorithm",
    option_d: "Kosaraju's Algorithm",
    correct_answer: "Dijkstra's Algorithm",
    explanation: "Dijkstra's algorithm uses a priority queue to greedily pick the closest unvisited vertex, solving single-source shortest paths for non-negative weights in O((V + E) log V)."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "String Algorithms",
    difficulty: "Hard",
    question_text: "What is the primary advantage of the Knuth-Morris-Pratt (KMP) string matching algorithm over naive matching?",
    option_a: "It uses randomized hash values",
    option_b: "It avoids re-examining previously matched characters using a Longest Prefix Suffix (LPS) array in O(N+M) time",
    option_c: "It only works on palindrome strings",
    option_d: "It sorts the text string beforehand",
    correct_answer: "It avoids re-examining previously matched characters using a Longest Prefix Suffix (LPS) array in O(N+M) time",
    explanation: "KMP preprocesses the pattern into an LPS array, allowing the search pointer to jump without backtracking into the main text."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Trees",
    difficulty: "Hard",
    question_text: "In an AVL Tree, what is the maximum permissible difference between the heights of the left and right subtrees for any node?",
    option_a: "0",
    option_b: "1",
    option_c: "2",
    option_d: "log N",
    correct_answer: "1",
    explanation: "An AVL tree is a strictly self-balancing BST where the balance factor (height(left) - height(right)) for every node must remain in {-1, 0, 1}."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Bit Manipulation",
    difficulty: "Easy",
    question_text: "What does the bitwise expression `(n & (n - 1)) == 0` check for a positive integer n?",
    option_a: "Whether n is an odd number",
    option_b: "Whether n is a power of 2",
    option_c: "Whether n is a prime number",
    option_d: "Whether n is negative",
    correct_answer: "Whether n is a power of 2",
    explanation: "A power of 2 in binary has exactly one '1' bit (e.g. 8 is 1000). Subtracting 1 flips all bits up to that 1 (7 is 0111). Their AND equals 0."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Disjoint Set",
    difficulty: "Medium",
    question_text: "What is the nearly constant amortized time complexity of union and find operations when Union by Rank and Path Compression are used together?",
    option_a: "O(1)",
    option_b: "O(α(N)) (Inverse Ackermann function)",
    option_c: "O(log N)",
    option_d: "O(sqrt(N))",
    correct_answer: "O(α(N)) (Inverse Ackermann function)",
    explanation: "Union by rank and path compression optimize the DSU tree height so effectively that operations run in O(α(N)) time, which is strictly less than 5 for all practical universe sizes."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Trie",
    difficulty: "Medium",
    question_text: "What is a Trie (Prefix Tree) primarily optimized for in technical applications?",
    option_a: "Finding shortest paths in maps",
    option_b: "Fast prefix matching, auto-complete, and dictionary lookups of strings",
    option_c: "Matrix multiplication in O(N^2)",
    option_d: "Memory-efficient storage of floating point numbers",
    correct_answer: "Fast prefix matching, auto-complete, and dictionary lookups of strings",
    explanation: "A Trie stores common prefixes along paths, enabling O(L) search, insert, and prefix queries where L is the string length."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Recursion & Backtracking",
    difficulty: "Medium",
    question_text: "In the N-Queens problem on an N x N chessboard, which algorithmic strategy is used to prune invalid partial boards?",
    option_a: "Greedy Search",
    option_b: "Backtracking with constraint propagation",
    option_c: "Dynamic Programming Memoization",
    option_d: "Breadth First Search Queue",
    correct_answer: "Backtracking with constraint propagation",
    explanation: "Backtracking places queens row by row and immediately retreats (backtracks) as soon as an attack constraint along columns or diagonals is violated."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Arrays",
    difficulty: "Medium",
    question_text: "Kadane's Algorithm is widely used to solve which famous problem in linear O(N) time?",
    option_a: "Longest Increasing Subsequence",
    option_b: "Maximum Subarray Sum (contiguous)",
    option_c: "0/1 Knapsack Problem",
    option_d: "Finding the Median of Two Sorted Arrays",
    correct_answer: "Maximum Subarray Sum (contiguous)",
    explanation: "Kadane's algorithm maintains the maximum subarray sum ending at current index and updates the global maximum in a single pass."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Graphs",
    difficulty: "Hard",
    question_text: "Which algorithm can detect negative weight cycles in a directed graph?",
    option_a: "Dijkstra's Algorithm",
    option_b: "Bellman-Ford Algorithm",
    option_c: "Prim's Minimum Spanning Tree",
    option_d: "A* Search Algorithm",
    correct_answer: "Bellman-Ford Algorithm",
    explanation: "Bellman-Ford relaxes all edges V-1 times. If an edge can still be relaxed on the V-th pass, a negative cycle exists."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Greedy Algorithms",
    difficulty: "Easy",
    question_text: "In the Fractional Knapsack Problem, items can be split into parts. Which greedy strategy yields the optimal value?",
    option_a: "Pick items with the lowest weight first",
    option_b: "Pick items with the highest value-to-weight ratio (value/weight) first",
    option_c: "Pick items with the highest total value first",
    option_d: "Pick items in random order until capacity is full",
    correct_answer: "Pick items with the highest value-to-weight ratio (value/weight) first",
    explanation: "Sorting items by unit value density (value / weight) and packing the highest ratios first guarantees maximal total value for fractional items."
  },

  // =========================================================================
  // 2. SYSTEM DESIGN & ARCHITECTURE (25 Questions)
  // =========================================================================
  {
    category: "System Design & Architecture",
    subcategory: "Scalability",
    difficulty: "Easy",
    question_text: "What is the fundamental difference between Vertical Scaling (Scale Up) and Horizontal Scaling (Scale Out)?",
    option_a: "Vertical adds more machines; Horizontal adds more RAM to a single machine",
    option_b: "Vertical upgrades hardware resources on an existing server; Horizontal adds more commodity servers to a distributed pool",
    option_c: "Vertical is used for NoSQL; Horizontal is strictly for SQL",
    option_d: "Vertical eliminates network latency; Horizontal requires no load balancer",
    correct_answer: "Vertical upgrades hardware resources on an existing server; Horizontal adds more commodity servers to a distributed pool",
    explanation: "Vertical scaling increases CPU/RAM on one machine (limited by hardware ceilings), while horizontal scaling distributes traffic across many clustered instances."
  },
  {
    category: "System Design & Architecture",
    subcategory: "CAP Theorem",
    difficulty: "Medium",
    question_text: "According to Eric Brewer's CAP Theorem, in the presence of a Network Partition (P), a distributed system must choose between which two guarantees?",
    option_a: "Concurrency (C) or Performance (P)",
    option_b: "Consistency (C) or Availability (A)",
    option_c: "Atomicity (A) or Durability (D)",
    option_d: "Throughput (T) or Latency (L)",
    correct_answer: "Consistency (C) or Availability (A)",
    explanation: "When network nodes cannot communicate (Partition), the system can either reject requests to preserve strict data Consistency or accept writes on isolated nodes to preserve Availability."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Caching",
    difficulty: "Medium",
    question_text: "In a Cache-Aside (Lazy Loading) caching pattern, what happens when an application attempts to read data that is not present in the cache (cache miss)?",
    option_a: "The cache automatically queries the database and updates itself asynchronously",
    option_b: "The application queries the database directly, writes the result into the cache, and returns data to the client",
    option_c: "The request fails with a 404 error",
    option_d: "The database rejects subsequent writes until cache is refreshed",
    correct_answer: "The application queries the database directly, writes the result into the cache, and returns data to the client",
    explanation: "With Cache-Aside, the application layer is responsible for reading from DB upon a miss and repopulating the cache for subsequent reads."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Load Balancing",
    difficulty: "Medium",
    question_text: "Which load balancing algorithm hashes incoming client IP addresses or keys so that requests from a specific client always hit the same backend server instance?",
    option_a: "Round Robin",
    option_b: "Least Connections",
    option_c: "IP Hash / Sticky Sessions",
    option_d: "Random Selection with Two Choices",
    correct_answer: "IP Hash / Sticky Sessions",
    explanation: "IP Hashing computes a hash of the client IP to deterministically route requests to the same server, preserving in-memory session states."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Message Queues",
    difficulty: "Medium",
    question_text: "Why are distributed message brokers (such as Apache Kafka or RabbitMQ) introduced in microservices architectures?",
    option_a: "To replace primary relational databases",
    option_b: "To decouple services, buffer spikes in traffic (backpressure), and enable asynchronous event processing",
    option_c: "To perform real-time SQL joins across microservices",
    option_d: "To encrypt client browser traffic",
    correct_answer: "To decouple services, buffer spikes in traffic (backpressure), and enable asynchronous event processing",
    explanation: "Message queues allow producers to publish messages without waiting for consumers, smoothing traffic bursts and isolating component failures."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Database Sharding",
    difficulty: "Hard",
    question_text: "What is Database Sharding (Horizontal Partitioning)?",
    option_a: "Replicating identical copies of a database to multiple read-replicas",
    option_b: "Splitting rows of a dataset across multiple independent database servers based on a shard key",
    option_c: "Splitting columns of a table into separate normalized tables",
    option_d: "Compressing database indexes into SSD storage",
    correct_answer: "Splitting rows of a dataset across multiple independent database servers based on a shard key",
    explanation: "Sharding breaks large datasets into smaller chunks (shards) distributed across distinct nodes, overcoming single-server storage and write throughput limits."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Consistent Hashing",
    difficulty: "Hard",
    question_text: "Why is Consistent Hashing preferred over traditional modulo hashing (`hash(key) % N`) in distributed caching rings like Redis/Memcached?",
    option_a: "It eliminates all hash collisions completely",
    option_b: "When a node is added or removed, only `k/N` keys need to be remapped on average rather than almost all keys",
    option_c: "It runs in O(1) space on client devices",
    option_d: "It forces all data to be stored on the master node",
    correct_answer: "When a node is added or removed, only `k/N` keys need to be remapped on average rather than almost all keys",
    explanation: "Consistent hashing places both nodes and keys on a virtual ring (0 to 2^32-1); scaling nodes up or down only invalidates adjacent keys, preventing massive cache stampedes."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Rate Limiting",
    difficulty: "Medium",
    question_text: "Which rate limiting algorithm allows bursts of traffic up to a bucket capacity and refills tokens at a steady continuous rate?",
    option_a: "Fixed Window Counter",
    option_b: "Token Bucket Algorithm",
    option_c: "Sliding Window Log",
    option_d: "Exponential Backoff",
    correct_answer: "Token Bucket Algorithm",
    explanation: "The Token Bucket algorithm accumulates tokens up to max capacity. Each request consumes a token; if empty, requests are throttled, supporting controlled bursts."
  },
  {
    category: "System Design & Architecture",
    subcategory: "API Design",
    difficulty: "Easy",
    question_text: "What does it mean for an HTTP method in RESTful API design to be 'Idempotent'?",
    option_a: "The method executes faster than other HTTP verbs",
    option_b: "Making multiple identical requests produces the exact same server state as making a single request",
    option_c: "The request body must be encrypted",
    option_d: "The response is always cached by the browser",
    correct_answer: "Making multiple identical requests produces the exact same server state as making a single request",
    explanation: "HTTP methods like GET, PUT, and DELETE are idempotent because executing `PUT /user/1` ten times leaves user 1 in the same state as executing it once."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Reliability & Circuit Breaker",
    difficulty: "Hard",
    question_text: "In distributed microservices, what is the purpose of the Circuit Breaker pattern (e.g. Netflix Hystrix / Resilience4j)?",
    option_a: "To route traffic based on geo-location DNS",
    option_b: "To prevent cascading service failures by failing fast when a downstream dependency is unhealthy",
    option_c: "To compress large JSON payloads over HTTP/2",
    option_d: "To automatically migrate relational databases to NoSQL",
    correct_answer: "To prevent cascading service failures by failing fast when a downstream dependency is unhealthy",
    explanation: "A circuit breaker transitions from Closed to Open when consecutive failures cross a threshold, returning fallback responses immediately rather than exhausting server threads."
  },

  // =========================================================================
  // 3. DATABASE MANAGEMENT & SQL (25 Questions)
  // =========================================================================
  {
    category: "Database Management & SQL",
    subcategory: "ACID Properties",
    difficulty: "Easy",
    question_text: "What does the 'A' in the ACID properties of database transactions stand for, and what does it guarantee?",
    option_a: "Availability: Database is reachable 99.999% of the time",
    option_b: "Atomicity: All operations in a transaction complete successfully, or none of them do (all-or-nothing)",
    option_c: "Asynchronous: Writes are buffered before committing to disk",
    option_d: "Authorization: Only authenticated users can perform queries",
    correct_answer: "Atomicity: All operations in a transaction complete successfully, or none of them do (all-or-nothing)",
    explanation: "Atomicity ensures transactional integrity: if any statement within a transaction fails, the entire transaction is rolled back."
  },
  {
    category: "Database Management & SQL",
    subcategory: "Indexing",
    difficulty: "Medium",
    question_text: "Why is a B+ Tree preferred over a standard Binary Search Tree (BST) or Red-Black Tree for disk-based relational database indexes?",
    option_a: "B+ Trees have higher heights to distribute keys deeper",
    option_b: "B+ Trees have high fan-out, shallow depth (minimizing slow disk I/O reads), and linked leaf nodes for efficient range scans",
    option_c: "B+ Trees store full table records in every internal node",
    option_d: "B+ Trees do not require rebalancing during insertions",
    correct_answer: "B+ Trees have high fan-out, shallow depth (minimizing slow disk I/O reads), and linked leaf nodes for efficient range scans",
    explanation: "Because disk I/O is slow, B+ tree nodes store hundreds of keys per block (high branching factor), keeping tree height low (3-4 levels for millions of rows)."
  },
  {
    category: "Database Management & SQL",
    subcategory: "Normalization",
    difficulty: "Medium",
    question_text: "A relational database table is in Third Normal Form (3NF) if it is in 2NF and has no:",
    option_a: "Composite primary keys",
    option_b: "Transitive functional dependencies between non-key attributes",
    option_c: "Foreign key constraints",
    option_d: "Null values in any row",
    correct_answer: "Transitive functional dependencies between non-key attributes",
    explanation: "3NF requires that no non-prime attribute depends on another non-prime attribute (X -> Y and Y -> Z where Z is non-key is transitive dependency)."
  },
  {
    category: "Database Management & SQL",
    subcategory: "SQL Queries",
    difficulty: "Easy",
    question_text: "What is the difference between `WHERE` and `HAVING` clauses in SQL?",
    option_a: "`WHERE` filters groups of rows; `HAVING` filters individual rows before grouping",
    option_b: "`WHERE` filters rows before aggregation; `HAVING` filters grouped rows after `GROUP BY` aggregation",
    option_c: "`WHERE` is only used with `SELECT`; `HAVING` is only used with `DELETE`",
    option_d: "`HAVING` cannot use aggregate functions like `COUNT()` or `SUM()`",
    correct_answer: "`WHERE` filters rows before aggregation; `HAVING` filters grouped rows after `GROUP BY` aggregation",
    explanation: "`WHERE` filters individual records prior to grouping. `HAVING` filters group-level aggregates (e.g. `HAVING COUNT(*) > 5`)."
  },
  {
    category: "Database Management & SQL",
    subcategory: "Transaction Isolation",
    difficulty: "Hard",
    question_text: "Which SQL transaction isolation level prevents Dirty Reads, Non-Repeatable Reads, and Phantom Reads?",
    option_a: "Read Uncommitted",
    option_b: "Read Committed",
    option_c: "Repeatable Read",
    option_d: "Serializable",
    correct_answer: "Serializable",
    explanation: "Serializable is the highest isolation level. It executes transactions concurrently in a manner equivalent to serial (sequential) execution, eliminating all read anomalies."
  },
  {
    category: "Database Management & SQL",
    subcategory: "Joins",
    difficulty: "Easy",
    question_text: "Which SQL JOIN returns all records from the left table and the matched records from the right table, filling with NULL where no match exists?",
    option_a: "INNER JOIN",
    option_b: "LEFT OUTER JOIN",
    option_c: "RIGHT OUTER JOIN",
    option_d: "CROSS JOIN",
    correct_answer: "LEFT OUTER JOIN",
    explanation: "A LEFT OUTER JOIN preserves all rows from the left-hand table regardless of whether matching foreign keys exist in the right-hand table."
  },
  {
    category: "Database Management & SQL",
    subcategory: "NoSQL vs SQL",
    difficulty: "Medium",
    question_text: "When is a Document-oriented NoSQL database (e.g. MongoDB) typically favored over a Relational Database (e.g. PostgreSQL)?",
    option_a: "When complex multi-table ACID joins across financial ledgers are required",
    option_b: "When dealing with rapidly evolving semi-structured hierarchical JSON documents, polymorphic data, and high-velocity horizontal scaling",
    option_c: "When strict schema enforcement is required at the storage layer",
    option_d: "When memory usage must be kept under 64MB",
    correct_answer: "When dealing with rapidly evolving semi-structured hierarchical JSON documents, polymorphic data, and high-velocity horizontal scaling",
    explanation: "Document stores accommodate dynamic schema variations and nested JSON objects naturally without schema migrations or relational table joins."
  },
  {
    category: "Database Management & SQL",
    subcategory: "Query Optimization",
    difficulty: "Medium",
    question_text: "In SQL execution, what does a 'Seq Scan' (Sequential Scan) indicate in an `EXPLAIN ANALYZE` query plan?",
    option_a: "The database used a B-Tree index to pinpoint rows in O(log N)",
    option_b: "The database read every single block of the table sequentially from beginning to end",
    option_c: "The query was answered entirely from L1 CPU cache",
    option_d: "The table was locked in exclusive mode",
    correct_answer: "The database read every single block of the table sequentially from beginning to end",
    explanation: "A sequential scan reads the entire table from disk. For large tables, adding an appropriate index converts this into a rapid index scan."
  },

  // =========================================================================
  // 4. OPERATING SYSTEMS & CONCURRENCY (25 Questions)
  // =========================================================================
  {
    category: "Operating Systems",
    subcategory: "Processes vs Threads",
    difficulty: "Easy",
    question_text: "What is the primary difference in memory allocation between a Process and a Thread within the same process?",
    option_a: "Processes share heap memory; threads have separate address spaces",
    option_b: "Processes have isolated independent virtual address spaces; threads share the process's code, data, and heap while keeping private stacks",
    option_c: "Threads have higher context-switch overhead than processes",
    option_d: "Processes cannot communicate with each other",
    correct_answer: "Processes have isolated independent virtual address spaces; threads share the process's code, data, and heap while keeping private stacks",
    explanation: "Threads of a process share the same memory space (heap, global variables, file descriptors), making thread context switching faster than process context switching."
  },
  {
    category: "Operating Systems",
    subcategory: "Deadlocks",
    difficulty: "Medium",
    question_text: "What are the four Coffman conditions necessary for a Deadlock to occur in an operating system?",
    option_a: "Priority Inversion, Starvation, Aging, Thrashing",
    option_b: "Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait",
    option_c: "Paging, Segmentation, Swapping, Compaction",
    option_d: "Atomicity, Consistency, Isolation, Durability",
    correct_answer: "Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait",
    explanation: "Deadlocks can only happen if all 4 conditions hold simultaneously: exclusive resource holding, holding while waiting for more, inability to forcibly take resources, and circular dependency."
  },
  {
    category: "Operating Systems",
    subcategory: "Virtual Memory",
    difficulty: "Medium",
    question_text: "What is a 'Page Fault' in an operating system virtual memory management unit (MMU)?",
    option_a: "A fatal kernel panic that requires server reboot",
    option_b: "A hardware interrupt raised when a program accesses a virtual page that is not currently mapped in physical RAM (resident in disk swap)",
    option_c: "A compilation syntax error in C programs",
    option_d: "A stack overflow caused by infinite recursion",
    correct_answer: "A hardware interrupt raised when a program accesses a virtual page that is not currently mapped in physical RAM (resident in disk swap)",
    explanation: "When a referenced virtual address points to an unmapped page, the MMU triggers a page fault exception, causing the OS kernel to load the page from disk swap into RAM."
  },
  {
    category: "Operating Systems",
    subcategory: "Synchronization",
    difficulty: "Medium",
    question_text: "What is the key functional difference between a Mutex (Mutual Exclusion Lock) and a Counting Semaphore?",
    option_a: "A Mutex can be unlocked by any thread; a Semaphore can only be unlocked by its creator",
    option_b: "A Mutex has ownership and allows only one thread to access a critical section; a Semaphore allows up to N threads based on its integer counter",
    option_c: "Semaphores cannot be used in multi-threaded programs",
    option_d: "Mutexes do not work on multicore processors",
    correct_answer: "A Mutex has ownership and allows only one thread to access a critical section; a Semaphore allows up to N threads based on its integer counter",
    explanation: "A mutex is a locking mechanism owned by the thread that locked it. A counting semaphore is a signaling mechanism regulating access to a pool of N shared resources."
  },
  {
    category: "Operating Systems",
    subcategory: "CPU Scheduling",
    difficulty: "Easy",
    question_text: "Which CPU scheduling algorithm gives each process a small fixed unit of CPU time (time quantum) in a cyclic queue?",
    option_a: "First-Come, First-Served (FCFS)",
    option_b: "Shortest Job Next (SJN)",
    option_c: "Round Robin (RR)",
    option_d: "Priority Scheduling without preemption",
    correct_answer: "Round Robin (RR)",
    explanation: "Round Robin allocates a time slice (quantum) to each ready process in turn, preventing any single CPU-bound job from starving interactive processes."
  },
  {
    category: "Operating Systems",
    subcategory: "Thrashing",
    difficulty: "Hard",
    question_text: "What is 'Thrashing' in an operating system?",
    option_a: "A state where the CPU clock frequency fluctuates wildly",
    option_b: "A state where the operating system spends more time swapping pages in and out of disk than executing actual user instructions",
    option_c: "A physical hard drive failure caused by bad sectors",
    option_d: "A Denial of Service attack on the network interface",
    correct_answer: "A state where the operating system spends more time swapping pages in and out of disk than executing actual user instructions",
    explanation: "When the total working set of all active processes exceeds available physical RAM, page faults skyrocket, forcing the system into continuous paging I/O."
  },

  // =========================================================================
  // 5. COMPUTER NETWORKS (25 Questions)
  // =========================================================================
  {
    category: "Computer Networks",
    subcategory: "TCP vs UDP",
    difficulty: "Easy",
    question_text: "What is the primary difference between Transmission Control Protocol (TCP) and User Datagram Protocol (UDP)?",
    option_a: "TCP is connectionless and fast; UDP is connection-oriented and reliable",
    option_b: "TCP is connection-oriented, guarantees ordered packet delivery, and has flow/congestion control; UDP is connectionless and prioritizes low latency",
    option_c: "UDP encrypts all packets automatically with TLS",
    option_d: "TCP cannot be used over wireless networks",
    correct_answer: "TCP is connection-oriented, guarantees ordered packet delivery, and has flow/congestion control; UDP is connectionless and prioritizes low latency",
    explanation: "TCP uses a 3-way handshake and ACKs to guarantee delivery without loss or reordering. UDP broadcasts datagrams with minimal overhead for live streaming and gaming."
  },
  {
    category: "Computer Networks",
    subcategory: "TCP 3-Way Handshake",
    difficulty: "Medium",
    question_text: "What is the correct sequence of TCP packet flags exchanged to establish a client-server connection?",
    option_a: "ACK -> SYN -> SYN-ACK",
    option_b: "SYN -> SYN-ACK -> ACK",
    option_c: "FIN -> ACK -> FIN-ACK",
    option_d: "RST -> SYN -> ACK",
    correct_answer: "SYN -> SYN-ACK -> ACK",
    explanation: "Client sends SYN (synchronize sequence number), server responds with SYN-ACK (acknowledge client SYN and send server SYN), and client replies with ACK."
  },
  {
    category: "Computer Networks",
    subcategory: "HTTP vs HTTPS",
    difficulty: "Easy",
    question_text: "What protocol layer does HTTPS use to encrypt and secure communication between the browser and web server?",
    option_a: "IPSec at Layer 3",
    option_b: "Transport Layer Security (TLS / SSL) at Layer 4-6",
    option_c: "BGP Routing Protocols",
    option_d: "DHCP Broadcasts",
    correct_answer: "Transport Layer Security (TLS / SSL) at Layer 4-6",
    explanation: "HTTPS encapsulates standard HTTP requests inside an encrypted TLS cryptographic tunnel, providing confidentiality, data integrity, and server authentication."
  },
  {
    category: "Computer Networks",
    subcategory: "DNS",
    difficulty: "Easy",
    question_text: "What is the primary function of the Domain Name System (DNS) on the internet?",
    option_a: "Routing physical fiber optic cables between continents",
    option_b: "Translating human-readable domain names (e.g. google.com) into numerical IP addresses (e.g. 142.250.190.46)",
    option_c: "Assigning MAC addresses to network interface cards",
    option_d: "Encrypting email messages",
    correct_answer: "Translating human-readable domain names (e.g. google.com) into numerical IP addresses (e.g. 142.250.190.46)",
    explanation: "DNS acts as the internet's phonebook, mapping alphabetic hostnames to the IP addresses required for network packet routing."
  },
  {
    category: "Computer Networks",
    subcategory: "OSI Model",
    difficulty: "Medium",
    question_text: "At which layer of the 7-Layer OSI Model do Routers operate to forward packets across different subnets using IP addresses?",
    option_a: "Layer 2 (Data Link Layer)",
    option_b: "Layer 3 (Network Layer)",
    option_c: "Layer 4 (Transport Layer)",
    option_d: "Layer 7 (Application Layer)",
    correct_answer: "Layer 3 (Network Layer)",
    explanation: "Layer 3 (Network) handles logical IP addressing, routing tables, and packet forwarding across heterogeneous networks."
  },
  {
    category: "Computer Networks",
    subcategory: "WebSockets vs HTTP",
    difficulty: "Medium",
    question_text: "What architectural advantage does a WebSocket connection offer over traditional HTTP request-response polling?",
    option_a: "WebSockets work without any network connection",
    option_b: "WebSockets provide persistent, full-duplex, bidirectional communication over a single TCP connection with minimal header overhead",
    option_c: "WebSockets eliminate the need for a backend server",
    option_d: "WebSockets automatically convert SQL to JSON",
    correct_answer: "WebSockets provide persistent, full-duplex, bidirectional communication over a single TCP connection with minimal header overhead",
    explanation: "After an initial HTTP handshake upgrade, WebSockets maintain an open socket where both client and server can send frames instantly without re-establishing headers."
  },

  // =========================================================================
  // 6. OBJECT-ORIENTED PROGRAMMING & DESIGN PATTERNS (20 Questions)
  // =========================================================================
  {
    category: "OOP & Design Patterns",
    subcategory: "SOLID Principles",
    difficulty: "Medium",
    question_text: "In the SOLID design principles, what does the Open/Closed Principle (OCP) mandate?",
    option_a: "Software entities (classes, modules) should be open for extension, but closed for modification",
    option_b: "All classes must have public constructors and private methods",
    option_c: "Databases should never be closed after queries",
    option_d: "Classes must only implement one interface",
    correct_answer: "Software entities (classes, modules) should be open for extension, but closed for modification",
    explanation: "OCP states that you should be able to add new functionality (e.g. through inheritance, polymorphism, or strategy patterns) without modifying existing tested code."
  },
  {
    category: "OOP & Design Patterns",
    subcategory: "Polymorphism",
    difficulty: "Easy",
    question_text: "What is the difference between Method Overloading (Compile-Time) and Method Overriding (Runtime Polymorphism)?",
    option_a: "Overloading occurs in different classes with identical signatures; Overriding occurs in the same class",
    option_b: "Overloading has the same method name with different parameter signatures in the same class; Overriding provides a specific implementation in a subclass of a parent method",
    option_c: "Overloading requires the `virtual` keyword in all languages",
    option_d: "Overriding can only be used with static methods",
    correct_answer: "Overloading has the same method name with different parameter signatures in the same class; Overriding provides a specific implementation in a subclass of a parent method",
    explanation: "Overloading resolves at compile-time via signatures. Overriding resolves dynamically at runtime via vtables based on the actual object instance."
  },
  {
    category: "OOP & Design Patterns",
    subcategory: "Singleton Pattern",
    difficulty: "Medium",
    question_text: "What is the primary objective of the Singleton Design Pattern, and how is it typically implemented?",
    option_a: "To create multiple clone copies of an object; implemented with a public clone method",
    option_b: "To ensure a class has only one instance throughout the application lifecycle and provide a global access point to it; implemented with a private constructor and static getter",
    option_c: "To serialize objects into XML format",
    option_d: "To dynamically wrap objects with additional decorators",
    correct_answer: "To ensure a class has only one instance throughout the application lifecycle and provide a global access point to it; implemented with a private constructor and static getter",
    explanation: "Singleton restricts instantiation by making the constructor private and providing a static `getInstance()` method (e.g. for database connection pools)."
  },
  {
    category: "OOP & Design Patterns",
    subcategory: "Factory Pattern",
    difficulty: "Medium",
    question_text: "Why is the Factory Method design pattern used instead of direct constructor calls (`new ConcreteClass()`)?",
    option_a: "It eliminates memory garbage collection",
    option_b: "It decouples client code from specific concrete classes by delegating object instantiation to a dedicated factory interface or method",
    option_c: "It forces all objects to be immutable singletons",
    option_d: "It automatically saves instances to a database",
    correct_answer: "It decouples client code from specific concrete classes by delegating object instantiation to a dedicated factory interface or method",
    explanation: "Factory pattern allows adding new concrete types without changing the client code that consumes the interface, adhering to Loose Coupling and OCP."
  },
  {
    category: "OOP & Design Patterns",
    subcategory: "Observer Pattern",
    difficulty: "Medium",
    question_text: "Which design pattern defines a one-to-many dependency between objects such that when one object changes state, all its dependents are notified and updated automatically?",
    option_a: "Adapter Pattern",
    option_b: "Observer Pattern (Publish-Subscribe)",
    option_c: "Proxy Pattern",
    option_d: "Facade Pattern",
    correct_answer: "Observer Pattern (Publish-Subscribe)",
    explanation: "The Observer pattern is the foundation for event-driven architectures, UI state listeners, and message queues, notifying subscribers of state mutations."
  },

  // =========================================================================
  // 7. REACT & MODERN FRONTEND (25 Questions)
  // =========================================================================
  {
    category: "React & Modern Frontend",
    subcategory: "Virtual DOM & Reconciliation",
    difficulty: "Medium",
    question_text: "How does React's Virtual DOM Reconciliation algorithm achieve high rendering performance?",
    option_a: "By completely recreating the browser HTML document on every user click",
    option_b: "By comparing in-memory virtual DOM snapshots (diffing algorithm in O(N)) and computing the minimal set of batched real DOM mutations",
    option_c: "By compiling JavaScript directly to C++ assembly binaries",
    option_d: "By disabling all CSS stylesheet animations",
    correct_answer: "By comparing in-memory virtual DOM snapshots (diffing algorithm in O(N)) and computing the minimal set of batched real DOM mutations",
    explanation: "React diffs the previous and current Virtual DOM trees with heuristic O(N) rules, applying only the necessary mutations to the slow browser DOM in batches."
  },
  {
    category: "React & Modern Frontend",
    subcategory: "Hooks - useEffect",
    difficulty: "Easy",
    question_text: "In React, what does passing an empty dependency array `[]` as the second argument to `useEffect()` signify?",
    option_a: "The effect runs on every single component re-render",
    option_b: "The effect runs only once after the initial component mount",
    option_c: "The effect never runs at all",
    option_d: "The component will immediately unmount",
    correct_answer: "The effect runs only once after the initial component mount",
    explanation: "An empty dependency array tells React that the effect doesn't depend on any props or state, mimicking `componentDidMount`."
  },
  {
    category: "React & Modern Frontend",
    subcategory: "Hooks - useMemo & useCallback",
    difficulty: "Medium",
    question_text: "What is the key difference between `useMemo` and `useCallback` in React functional components?",
    option_a: "`useMemo` caches a calculated value; `useCallback` caches a function definition between renders",
    option_b: "`useMemo` is for asynchronous fetch calls; `useCallback` is for synchronous math",
    option_c: "`useCallback` forces a child component to re-render; `useMemo` stops all rendering",
    option_d: "There is no difference; they are aliases",
    correct_answer: "`useMemo` caches a calculated value; `useCallback` caches a function definition between renders",
    explanation: "`useMemo(() => computeValue(a, b), [a, b])` memoizes expensive calculation results, while `useCallback(fn, deps)` preserves function instance references to prevent child re-renders."
  },
  {
    category: "React & Modern Frontend",
    subcategory: "State Management",
    difficulty: "Easy",
    question_text: "Why should React component state never be mutated directly (e.g. `state.count = 5`)?",
    option_a: "JavaScript throws a syntax error on assignment",
    option_b: "React relies on shallow reference equality checks; mutating state directly bypasses the re-render cycle and breaks state predictability",
    option_c: "Direct mutation causes memory leaks in the browser",
    option_d: "Direct mutation deletes local storage cookies",
    correct_answer: "React relies on shallow reference equality checks; mutating state directly bypasses the re-render cycle and breaks state predictability",
    explanation: "Calling `setState()` or `setCount()` informs React of a state change and schedules a re-render. Direct mutation modifies the memory object without triggering UI updates."
  },
  {
    category: "React & Modern Frontend",
    subcategory: "JavaScript Event Loop",
    difficulty: "Hard",
    question_text: "In the JavaScript runtime event loop, which queue has higher execution priority after the call stack clears: Microtask Queue or Macrotask (Callback) Queue?",
    option_a: "Macrotask Queue (setTimeout, setInterval, I/O)",
    option_b: "Microtask Queue (Promise.then, MutationObserver, queueMicrotask)",
    option_c: "Both queues execute alternately in round-robin fashion",
    option_d: "The operating system randomly chooses between them",
    correct_answer: "Microtask Queue (Promise.then, MutationObserver, queueMicrotask)",
    explanation: "After each current task completes on the call stack, the event loop drains ALL pending microtasks (Promises) before picking the next single macrotask (setTimeout)."
  },
  {
    category: "React & Modern Frontend",
    subcategory: "JavaScript Closures",
    difficulty: "Medium",
    question_text: "What is a Closure in JavaScript?",
    option_a: "A function that has been marked as private in TypeScript",
    option_b: "A function bundled together with references to its surrounding lexical environment, allowing it to access outer variables even after the outer function has executed",
    option_c: "The closing curly brace `}` of a code block",
    option_d: "An event listener that automatically unbinds itself",
    correct_answer: "A function bundled together with references to its surrounding lexical environment, allowing it to access outer variables even after the outer function has executed",
    explanation: "In JavaScript, functions form closures around their lexical scope, retaining access to outer variables even when passed as callbacks outside their original scope."
  },

  // =========================================================================
  // 8. QUANTITATIVE APTITUDE & REASONING (25 Questions)
  // =========================================================================
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Time, Speed & Distance",
    difficulty: "Easy",
    question_text: "A train 240 meters long passes a pole in 24 seconds. What is the speed of the train in km/h?",
    option_a: "30 km/h",
    option_b: "36 km/h",
    option_c: "40 km/h",
    option_d: "45 km/h",
    correct_answer: "36 km/h",
    explanation: "Speed = Distance / Time = 240m / 24s = 10 m/s. Converting to km/h: 10 * (18/5) = 36 km/h."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Profit and Loss",
    difficulty: "Easy",
    question_text: "An article is bought for $400 and sold for $500. What is the percentage profit gained on the cost price?",
    option_a: "20%",
    option_b: "25%",
    option_c: "30%",
    option_d: "15%",
    correct_answer: "25%",
    explanation: "Profit = Selling Price ($500) - Cost Price ($400) = $100. Profit % = (100 / 400) * 100 = 25%."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Probability",
    difficulty: "Medium",
    question_text: "Two fair 6-sided dice are rolled simultaneously. What is the probability of obtaining a sum of 7?",
    option_a: "1/12",
    option_b: "1/6",
    option_c: "5/36",
    option_d: "7/36",
    correct_answer: "1/6",
    explanation: "Total outcomes = 6 * 6 = 36. Favorable outcomes for sum of 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 pairs. Probability = 6/36 = 1/6."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Permutations & Combinations",
    difficulty: "Medium",
    question_text: "In how many distinct ways can a committee of 3 members be selected from a team of 8 engineers?",
    option_a: "24",
    option_b: "56",
    option_c: "336",
    option_d: "120",
    correct_answer: "56",
    explanation: "Combination formula: 8C3 = (8 * 7 * 6) / (3 * 2 * 1) = 336 / 6 = 56 ways."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Time and Work",
    difficulty: "Medium",
    question_text: "Alice can complete a software project in 12 days, and Bob can complete the same project in 6 days. Working together, in how many days will they finish the project?",
    option_a: "3 days",
    option_b: "4 days",
    option_c: "5 days",
    option_d: "4.5 days",
    correct_answer: "4 days",
    explanation: "Alice's 1-day work = 1/12. Bob's 1-day work = 1/6. Combined 1-day work = 1/12 + 2/12 = 3/12 = 1/4. Therefore, total days = 4 days."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Number Series",
    difficulty: "Easy",
    question_text: "Identify the next number in the sequence: 2, 6, 12, 20, 30, 42, ?",
    option_a: "52",
    option_b: "54",
    option_c: "56",
    option_d: "60",
    correct_answer: "56",
    explanation: "Differences between terms: 4, 6, 8, 10, 12. The next difference is 14. 42 + 14 = 56 (Also n*(n+1): 1*2, 2*3, 3*4, 4*5, 5*6, 6*7, 7*8=56)."
  }
];

// Helper to generate full 200+ suite across all 8 technical placement categories
function generateCompleteQuestionBank() {
  const allGenerated = [...interviewQuestions];

  const categoryTemplates = [
    {
      cat: "Data Structures & Algorithms",
      sub: "Advanced DSA",
      diffs: ["Easy", "Medium", "Hard"],
      topics: [
        { q: "What is the worst-case time complexity of Quick Sort?", a: "O(N^2)", b: "O(N log N)", c: "O(N)", d: "O(1)", ans: "O(N^2)", exp: "Quick Sort degrades to O(N^2) when the pivot chosen is consistently the extreme (smallest or largest) element in a sorted or reverse-sorted array." },
        { q: "Which data structure is fundamentally used for implementing Breadth First Search (BFS)?", a: "Stack", b: "Queue", c: "Binary Tree", d: "Hash Set", ans: "Queue", exp: "BFS explores neighbor nodes level by level in FIFO order, requiring a Queue data structure." },
        { q: "What is the minimum number of queues required to implement a Stack data structure?", a: "1", b: "2", c: "3", d: "4", ans: "2", exp: "A stack can be implemented using two queues by making either the push or pop operation costly to simulate LIFO." },
        { q: "What is the time complexity of searching for an element in an unweighted Adjacency List graph representation with V vertices and E edges?", a: "O(1)", b: "O(V + E)", c: "O(V^2)", d: "O(E log V)", ans: "O(V + E)", exp: "Graph traversal through an adjacency list visits all V vertices and examines all E incident edges." },
        { q: "In a Red-Black Tree, what is the color of the root node by definition?", a: "Red", b: "Black", c: "Either Red or Black", d: "Grey", ans: "Black", exp: "Property 2 of Red-Black Trees strictly requires that the root node must always be Black." },
        { q: "What is the space complexity of an in-order recursive traversal of a balanced binary tree with N nodes?", a: "O(1)", b: "O(log N)", c: "O(N)", d: "O(N log N)", ans: "O(log N)", exp: "The recursive call stack reaches a maximum depth equal to the height of the balanced tree, which is O(log N)." },
        { q: "Which algorithm finds the Minimum Spanning Tree of a connected weighted graph using a greedy edge-based approach with Disjoint Sets?", a: "Dijkstra's Algorithm", b: "Kruskal's Algorithm", c: "Floyd-Warshall Algorithm", d: "KMP Algorithm", ans: "Kruskal's Algorithm", exp: "Kruskal's algorithm sorts all edges by weight and adds them greedily while using Union-Find to avoid creating cycles." },
        { q: "What is the optimal time complexity to compute the Longest Common Subsequence (LCS) of two strings of length M and N using Dynamic Programming?", a: "O(M + N)", b: "O(M * N)", c: "O(2^(M+N))", d: "O(log(M*N))", ans: "O(M * N)", exp: "2D Dynamic Programming table of size (M+1) x (N+1) evaluates subproblems in O(M * N) time." },
        { q: "What is a segment tree primarily utilized for in competitive programming and interview coding?", a: "Storing string dictionaries", b: "Range queries (e.g. range sum/min) and point/range updates in O(log N) time", c: "Encrypting network passwords", d: "Managing database ACID locks", ans: "Range queries (e.g. range sum/min) and point/range updates in O(log N) time", exp: "Segment trees store aggregate range intervals across array partitions, allowing O(log N) query and update operations." },
        { q: "What is the auxiliary space complexity of Merge Sort when sorting an array of size N?", a: "O(1)", b: "O(N)", c: "O(log N)", d: "O(N^2)", ans: "O(N)", exp: "Standard Merge Sort allocates a temporary helper array of size N to merge two sorted subarrays." }
      ]
    },
    {
      cat: "System Design & Architecture",
      sub: "Distributed Systems",
      diffs: ["Medium", "Hard"],
      topics: [
        { q: "What is the primary role of an API Gateway in a microservices architecture?", a: "To compile frontend React code", b: "Single entry point handling request routing, authentication, rate limiting, and SSL termination", c: "To store SQL database tables", d: "To assign hardware IP addresses", ans: "Single entry point handling request routing, authentication, rate limiting, and SSL termination", exp: "An API Gateway centralizes cross-cutting concerns (auth, logging, throttling) and abstracts internal microservice topology from clients." },
        { q: "In distributed database replication, what is Eventual Consistency?", a: "Writes are immediately visible on all nodes synchronously within 1ms", b: "Replicas may temporarily diverge, but given no new updates, all replicas will eventually converge to the same value", c: "The database refuses all write operations during network partitions", d: "Data is deleted after 24 hours automatically", ans: "Replicas may temporarily diverge, but given no new updates, all replicas will eventually converge to the same value", exp: "Eventual consistency trades off immediate strict consistency to achieve high availability and low latency writes in distributed systems." },
        { q: "Which database replication topology features a single node accepting all write queries while multiple secondary nodes serve read queries?", a: "Multi-Leader Replication", b: "Single-Leader (Primary-Replica / Master-Slave) Replication", c: "Leaderless Quorum Replication", d: "Peer-to-Peer Mesh", ans: "Single-Leader (Primary-Replica / Master-Slave) Replication", exp: "In Primary-Replica topologies, only the primary accepts write transactions and replicates write-ahead logs (WAL) to read-only replicas." },
        { q: "What is the Write-Through caching strategy?", a: "Data is written directly to the database only, ignoring cache", b: "Data is written simultaneously to both the cache and the primary database before confirming success to the client", c: "Data is written to cache only and flushed to DB once per week", d: "Cache is invalidated without updating DB", ans: "Data is written simultaneously to both the cache and the primary database before confirming success to the client", exp: "Write-Through ensures cache and DB consistency on every write operation, avoiding stale cache reads at the cost of higher write latency." },
        { q: "What is a Content Delivery Network (CDN) primarily designed to do?", a: "Host relational database instances", b: "Cache and serve static assets (images, JS, CSS, video) from geographically distributed Edge servers close to users", c: "Compile Java bytecode", d: "Manage OAuth2 token refresh", ans: "Cache and serve static assets (images, JS, CSS, video) from geographically distributed Edge servers close to users", exp: "CDNs place edge proxy servers globally to drastically decrease Round Trip Time (RTT) latency for static content delivery." },
        { q: "What is the purpose of database Write-Ahead Logging (WAL)?", a: "To format JSON responses for frontend APIs", b: "To ensure durability and crash recovery by logging transaction changes to append-only disk storage before applying them to data pages", c: "To delete old rows automatically", d: "To prevent SQL injection attacks", ans: "To ensure durability and crash recovery by logging transaction changes to append-only disk storage before applying them to data pages", exp: "WAL writes state changes sequentially to disk before flushing memory pages, guaranteeing recovery from server power loss without data corruption." },
        { q: "What is the Gossip Protocol in distributed systems (e.g. Apache Cassandra)?", a: "A protocol where servers periodically exchange node state and health metadata in a peer-to-peer decentralized manner", b: "A chat client protocol for mobile phones", c: "A SQL injection testing framework", d: "A web browser audio compression algorithm", ans: "A protocol where servers periodically exchange node state and health metadata in a peer-to-peer decentralized manner", exp: "Gossip protocols spread cluster membership, failure detection, and ring topology information efficiently without a single point of failure." },
        { q: "What problem does the Saga Pattern solve in microservices?", a: "Compressing images over CDN", b: "Managing distributed transactions and maintaining data consistency across multiple service databases using compensating actions", c: "Generating CSS styles automatically", d: "Encrypting passwords with bcrypt", ans: "Managing distributed transactions and maintaining data consistency across multiple service databases using compensating actions", exp: "Saga coordinates a sequence of local transactions; if a step fails, it triggers compensating transactions to roll back previous state changes across services." }
      ]
    },
    {
      cat: "Database Management & SQL",
      sub: "SQL & Relational Engines",
      diffs: ["Easy", "Medium", "Hard"],
      topics: [
        { q: "What is the primary key constraint in SQL?", a: "A column that can contain duplicate null values", b: "A column or set of columns that uniquely identifies each row in a table and cannot contain NULL values", c: "An encrypted password column", d: "A table index that speeds up DELETE statements only", ans: "A column or set of columns that uniquely identifies each row in a table and cannot contain NULL values", exp: "Primary keys enforce entity integrity by requiring unique, non-null values for every record." },
        { q: "Which SQL clause is used to eliminate duplicate rows from the query output?", a: "GROUP BY ALL", b: "DISTINCT", c: "UNIQUE CHECK", d: "FILTER DUPLICATES", ans: "DISTINCT", exp: "`SELECT DISTINCT column FROM table;` filters out identical rows from the result set." },
        { q: "What is a Foreign Key in relational databases?", a: "A key generated by third-party APIs", b: "A column in one table that refers to the Primary Key of another table, enforcing referential integrity", c: "A temporary session token", d: "An index built on text columns only", ans: "A column in one table that refers to the Primary Key of another table, enforcing referential integrity", exp: "Foreign keys establish and enforce links between data in different tables, preventing orphaned records." },
        { q: "What is the result of executing `COUNT(*)` vs `COUNT(column_name)` in SQL?", a: "Both always return identical numbers", b: "`COUNT(*)` counts all rows including NULLs; `COUNT(column_name)` counts only non-NULL values in that specific column", c: "`COUNT(*)` only counts primary keys", d: "`COUNT(column_name)` is not valid SQL syntax", ans: "`COUNT(*)` counts all rows including NULLs; `COUNT(column_name)` counts only non-NULL values in that specific column", exp: "`COUNT(*)` returns total row cardinality, whereas specifying a column name ignores rows where that column contains NULL." },
        { q: "What is an SQL View?", a: "A physical hardware monitor connected to database servers", b: "A virtual table based on the result-set of an SQL statement, without storing physical data on disk (unless materialized)", c: "A temporary file created during database backup", d: "A database user permission level", ans: "A virtual table based on the result-set of an SQL statement, without storing physical data on disk (unless materialized)", exp: "A View encapsulates complex SQL queries into a reusable virtual table object for query simplification and security partitioning." },
        { q: "What is a Clustered Index in relational databases?", a: "An index that stores keys and determines the actual physical sorted storage order of the table rows on disk", b: "An index that can be created up to 1000 times per table", c: "An index stored only in client browser RAM", d: "A full-text search index for PDF documents", ans: "An index that stores keys and determines the actual physical sorted storage order of the table rows on disk", exp: "Because table rows can only be physically sorted in one way on disk, there can only be one Clustered Index per table." },
        { q: "What is the SQL `UNION ALL` operator?", a: "Combines the result sets of two queries and removes duplicate records", b: "Combines the result sets of two queries including all duplicate records without performing deduplication sorting", c: "Performs an inner join between two queries", d: "Deletes matching rows from both tables", ans: "Combines the result sets of two queries including all duplicate records without performing deduplication sorting", exp: "`UNION ALL` is faster than `UNION` because it concatenates result sets directly without incurring the overhead of a distinct sorting pass." },
        { q: "What is a Stored Procedure in SQL databases?", a: "A saved SQL query plan stored in the browser", b: "A precompiled collection of one or more SQL statements and control logic stored on the database server", c: "A hardware backup procedure for database hard drives", d: "An automated index rebuilder", ans: "A precompiled collection of one or more SQL statements and control logic stored on the database server", exp: "Stored procedures reduce network traffic and improve performance by executing compiled procedural logic directly on the DB server." }
      ]
    },
    {
      cat: "Operating Systems",
      sub: "Core OS Architecture",
      diffs: ["Easy", "Medium", "Hard"],
      topics: [
        { q: "What is the Critical Section Problem in multi-threaded programming?", a: "A section of code that causes CPU overheating", b: "A code segment accessing shared resources that must not be concurrently executed by more than one thread at a time", c: "A disk partitioning error", d: "A syntax error during C++ compilation", ans: "A code segment accessing shared resources that must not be concurrently executed by more than one thread at a time", exp: "To prevent race conditions, mutual exclusion primitives must ensure only one execution thread enters the critical section simultaneously." },
        { q: "What is Context Switching in an operating system?", a: "Changing the desktop wallpaper dynamically", b: "The process of saving the state of the currently running process/thread and restoring the state of another so execution can resume later", c: "Converting 32-bit integers to 64-bit integers", d: "Switching network cables between router ports", ans: "The process of saving the state of the currently running process/thread and restoring the state of another so execution can resume later", exp: "Context switching stores CPU registers, program counter, and stack pointers in the Process Control Block (PCB) to facilitate multitasking." },
        { q: "What is the difference between Preemptive and Non-Preemptive CPU Scheduling?", a: "Preemptive allows the OS to forcibly interrupt a running process; Non-Preemptive allows a process to hold the CPU until it terminates or yields", b: "Non-Preemptive is strictly used for mobile phones", c: "Preemptive scheduling never uses priority queues", d: "Non-Preemptive scheduling eliminates all context switching", ans: "Preemptive allows the OS to forcibly interrupt a running process; Non-Preemptive allows a process to hold the CPU until it terminates or yields", exp: "Preemptive scheduling enables responsive multitasking by switching out CPU-bound tasks when time quanta expire or higher-priority tasks arrive." },
        { q: "What is Belady's Anomaly in Virtual Memory page replacement algorithms?", a: "Increasing physical memory frames causes MORE page faults to occur in FIFO replacement", b: "Decreasing RAM increases CPU clock speed", c: "LRU page replacement causes memory fragmentation", d: "Virtual memory allocation becomes negative", ans: "Increasing physical memory frames causes MORE page faults to occur in FIFO replacement", exp: "Belady's Anomaly occurs in FIFO page replacement where adding additional page frames paradoxically increases total page faults for certain access strings." },
        { q: "What is an Inode in Unix/Linux filesystem architectures?", a: "A network router identifier", b: "A data structure that stores metadata about a file (size, permissions, owner, block locations) except its filename and file content", c: "A temporary swap file", d: "The root user password hash", ans: "A data structure that stores metadata about a file (size, permissions, owner, block locations) except its filename and file content", exp: "Inodes store all filesystem metadata and disk block pointers for files and directories in POSIX systems." },
        { q: "What is the purpose of Spooling (Simultaneous Peripheral Operations On-Line) in operating systems?", a: "Buffering I/O jobs into disk/memory queues so slower devices (like printers) can process data at their own pace without blocking the CPU", b: "Speeding up CPU multiplication instructions", c: "Compressing memory caches", d: "Encrypting file permissions", ans: "Buffering I/O jobs into disk/memory queues so slower devices (like printers) can process data at their own pace without blocking the CPU", exp: "Spooling decouples high-speed CPU execution from slow peripheral devices by placing output data into disk queues." },
        { q: "What is a Race Condition in concurrent systems?", a: "A competitive gaming scenario", b: "A flaw where output is dependent on the uncontrollable sequence or timing of concurrent execution threads", c: "A CPU benchmarking test", d: "An automated memory leak detector", ans: "A flaw where output is dependent on the uncontrollable sequence or timing of concurrent execution threads", exp: "Race conditions occur when two threads read and write shared state without synchronization, causing corrupt or nondeterministic data." }
      ]
    },
    {
      cat: "Computer Networks",
      sub: "Protocols & Web Infrastructure",
      diffs: ["Easy", "Medium", "Hard"],
      topics: [
        { q: "What is the purpose of the Address Resolution Protocol (ARP)?", a: "Resolving domain names to IP addresses", b: "Mapping a known IPv4 address to a physical hardware MAC address on a local Ethernet subnet", c: "Assigning dynamic IP addresses to laptops", d: "Routing packets across wide area networks", ans: "Mapping a known IPv4 address to a physical hardware MAC address on a local Ethernet subnet", exp: "ARP broadcasts on the local data link layer asking 'Who has this IP address?' to obtain the corresponding 48-bit MAC address." },
        { q: "What is the default TCP port used by secure HTTPS traffic?", a: "21", b: "80", c: "443", d: "8080", ans: "443", exp: "Standard unencrypted HTTP operates on port 80, while TLS-encrypted HTTPS operates on TCP port 443." },
        { q: "What is the main enhancement of HTTP/2 over HTTP/1.1?", a: "It removes the requirement for TCP", b: "Multiplexing multiple requests/responses over a single TCP connection, binary framing, and header compression (HPACK)", c: "It replaces HTML with XML", d: "It works only over satellite internet", ans: "Multiplexing multiple requests/responses over a single TCP connection, binary framing, and header compression (HPACK)", exp: "HTTP/2 avoids Head-of-Line blocking in the browser by streaming interleaved binary frames concurrently through a single TCP socket." },
        { q: "What is the Subnet Mask `255.255.255.0` (or `/24` in CIDR notation) used for?", a: "Designating the first 24 bits for the network prefix and the remaining 8 bits for host addressing (up to 254 usable hosts)", b: "Encrypting 24-bit passwords", c: "Setting 255 Mbps download speeds", d: "Limiting network connections to 24 users", ans: "Designating the first 24 bits for the network prefix and the remaining 8 bits for host addressing (up to 254 usable hosts)", exp: "A /24 subnet mask allocates 2^(32-24) = 256 addresses (254 usable after subtracting network and broadcast addresses)." },
        { q: "What is the purpose of Cross-Origin Resource Sharing (CORS) in web browsers?", a: "To allow web applications running at one origin to securely request resources from a different origin using HTTP headers", b: "To accelerate CSS font rendering", c: "To block all JavaScript execution in Chrome", d: "To compress image files automatically", ans: "To allow web applications running at one origin to securely request resources from a different origin using HTTP headers", exp: "Browsers enforce the Same-Origin Policy (SOP). CORS headers (like `Access-Control-Allow-Origin`) grant explicit permission for cross-domain API calls." },
        { q: "What is a NAT (Network Address Translation) router used for?", a: "Translating private local IP addresses (e.g. 192.168.1.X) to a single public IP address for internet routing", b: "Translating English URLs to Spanish", c: "Cleaning computer viruses from ethernet cables", d: "Generating SSL certificates", ans: "Translating private local IP addresses (e.g. 192.168.1.X) to a single public IP address for internet routing", exp: "NAT conserves IPv4 address space and adds basic security by mapping multiple internal private devices to a single external public IP." },
        { q: "What is an ICMP (Internet Control Message Protocol) packet primarily used for?", a: "Streaming 4K video files", b: "Diagnostic network error reporting and connectivity testing (e.g. `ping` and `traceroute`)", c: "Storing browser cookies", d: "Executing SQL database queries", ans: "Diagnostic network error reporting and connectivity testing (e.g. `ping` and `traceroute`)", exp: "ICMP generates diagnostic echo requests (`ping`) and TTL-exceeded notifications (`traceroute`) at the network layer." }
      ]
    },
    {
      cat: "OOP & Design Patterns",
      sub: "Enterprise Patterns",
      diffs: ["Easy", "Medium", "Hard"],
      topics: [
        { q: "What is Encapsulation in Object-Oriented Programming?", a: "Inheriting methods from multiple parent classes", b: "Bundling data (attributes) and methods that operate on that data into a single unit (class) while restricting direct outside access to internal state", c: "Writing recursive algorithms in Java", d: "Executing threads in parallel", ans: "Bundling data (attributes) and methods that operate on that data into a single unit (class) while restricting direct outside access to internal state", exp: "Encapsulation protects object integrity by hiding internal variables behind private access modifiers and exposing getter/setter methods." },
        { q: "What is the Adapter Design Pattern used for?", a: "Allowing classes with incompatible interfaces to work together by wrapping an existing class with a compatible interface", b: "Creating exactly one instance of a database connection", c: "Translating database SQL tables to MongoDB collections", d: "Encrypting user passwords", ans: "Allowing classes with incompatible interfaces to work together by wrapping an existing class with a compatible interface", exp: "Like a hardware power adapter, the Adapter pattern bridges the gap between an existing interface and a client's expected interface." },
        { q: "What is the difference between an Abstract Class and an Interface in Java / C#?", a: "An abstract class can contain state (instance variables) and implemented concrete methods; an interface defines pure contracts (and default methods)", b: "Interfaces can only have private methods", c: "A class can inherit multiple abstract classes but only one interface", d: "Abstract classes cannot have constructors", ans: "An abstract class can contain state (instance variables) and implemented concrete methods; an interface defines pure contracts (and default methods)", exp: "Classes can implement multiple interfaces (contract adherence) but can only inherit from a single parent abstract class in single-inheritance languages." },
        { q: "What is the Strategy Design Pattern?", a: "A pattern that defines a family of interchangeable algorithms, encapsulates each one, and makes them interchangeable at runtime", b: "A project management framework for software sprints", c: "An automated unit testing tool", d: "A database indexing strategy", ans: "A pattern that defines a family of interchangeable algorithms, encapsulates each one, and makes them interchangeable at runtime", exp: "Strategy allows clients to choose algorithms (e.g. PaymentStrategy: CreditCard, PayPal, Crypto) dynamically without modifying the context class." },
        { q: "What is the Dependency Inversion Principle (the 'D' in SOLID)?", a: "High-level modules should not depend on low-level modules; both should depend on abstractions (interfaces)", b: "Dependencies should be hardcoded in every class constructor", c: "Subclasses must override all superclass methods", d: "Classes should never use interfaces", ans: "High-level modules should not depend on low-level modules; both should depend on abstractions (interfaces)", exp: "Dependency Inversion decouples high-level business logic from low-level implementations (e.g. via Dependency Injection containers)." }
      ]
    },
    {
      cat: "React & Modern Frontend",
      sub: "JavaScript & Framework Internals",
      diffs: ["Easy", "Medium", "Hard"],
      topics: [
        { q: "What is the purpose of the `key` prop when rendering a list of elements in React?", a: "To apply CSS background colors to list items", b: "To help React identify which items have changed, been added, or removed, optimizing DOM reconciliation diffing", c: "To encrypt the component's state", d: "To bind keyboard event listeners", ans: "To help React identify which items have changed, been added, or removed, optimizing DOM reconciliation diffing", exp: "Keys provide stable identities across renders, allowing React to reorder and update elements efficiently without destroying the whole DOM list." },
        { q: "What is the difference between `null` and `undefined` in JavaScript?", a: "`undefined` represents a variable declared but not assigned a value; `null` is an intentional assignment representing 'no value'", b: "`null` is a string; `undefined` is a number", c: "`null === undefined` evaluates to true", d: "They are completely identical in every respect", ans: "`undefined` represents a variable declared but not assigned a value; `null` is an intentional assignment representing 'no value'", exp: "`undefined` is default uninitialized state (type 'undefined'), whereas `null` is an explicit object primitive representing intentional absence." },
        { q: "What does the `async/await` syntax in modern JavaScript do under the hood?", a: "Spawns new OS hardware threads for execution", b: "Provides syntactic sugar over standard Promises and generator functions to write asynchronous code in a readable synchronous style", c: "Blocks the browser UI until data arrives", d: "Converts JavaScript to Python", ans: "Provides syntactic sugar over standard Promises and generator functions to write asynchronous code in a readable synchronous style", exp: "`async` functions return a Promise, and `await` pauses function execution non-blockingly until the Promise settles." },
        { q: "What is Debouncing in frontend web development?", a: "Executing an event handler on every single keystroke without delay", b: "Delaying the execution of a function until a specified idle time has elapsed since the last time the event was triggered (e.g. search input)", c: "Deleting browser cache cookies on page unload", d: "A CSS layout animation technique", ans: "Delaying the execution of a function until a specified idle time has elapsed since the last time the event was triggered (e.g. search input)", exp: "Debouncing bundles rapid burst events (like keyboard typing) into a single delayed API request once the user stops typing." },
        { q: "What is the purpose of React Context API?", a: "To write SQL queries directly in React components", b: "To share global state across component trees without passing props manually at every level (prop drilling)", c: "To replace CSS flexbox layouts", d: "To bundle JavaScript code with Webpack", ans: "To share global state across component trees without passing props manually at every level (prop drilling)", exp: "React Context provides a way to pass data (theme, auth state, language) through the component tree without manually threading props down." }
      ]
    },
    {
      cat: "Aptitude & Logical Reasoning",
      sub: "Placement Problem Solving",
      diffs: ["Easy", "Medium", "Hard"],
      topics: [
        { q: "If a car travels at 60 km/h for the first 2 hours and 90 km/h for the next 3 hours, what is its average speed for the entire journey?", a: "75 km/h", b: "78 km/h", c: "80 km/h", d: "72 km/h", ans: "78 km/h", exp: "Total distance = (60 * 2) + (90 * 3) = 120 + 270 = 390 km. Total time = 2 + 3 = 5 hours. Average speed = 390 / 5 = 78 km/h." },
        { q: "A sum of money at simple interest doubles itself in 8 years. In how many years will it become 4 times the principal?", a: "16 years", b: "24 years", c: "32 years", d: "20 years", ans: "24 years", exp: "To double, Simple Interest = Principal (P) in 8 years. To become 4 times, Simple Interest must equal 3P. Time required = 3 * 8 = 24 years." },
        { q: "A bag contains 5 red balls and 4 blue balls. If two balls are drawn at random without replacement, what is the probability that both are red?", a: "5/18", b: "10/36", c: "5/9", d: "20/81", ans: "5/18", exp: "P(1st Red) = 5/9. P(2nd Red) = 4/8 = 1/2. Combined probability = (5/9) * (1/2) = 5/18." },
        { q: "Pointing to a photograph, John says: 'She is the daughter of my grandfather's only son.' How is the girl related to John?", a: "Mother", b: "Sister", c: "Cousin", d: "Aunt", ans: "Sister", exp: "John's grandfather's only son is John's father. The daughter of John's father is John's sister." },
        { q: "If in a certain code language, 'LEARN' is coded as 'OHDUQ', how is 'SMART' coded in that same language?", a: "VPDUW", b: "VPDWU", c: "UODTV", d: "WPEVX", ans: "VPDUW", exp: "Each letter is shifted forward by +3 alphabetical positions: S(+3)->V, M(+3)->P, A(+3)->D, R(+3)->U, T(+3)->W = VPDUW." },
        { q: "A pipe can fill a water tank in 10 hours, while an outlet pipe can empty it in 15 hours. If both pipes are opened simultaneously, in how many hours will the tank be filled?", a: "25 hours", b: "30 hours", c: "20 hours", d: "12 hours", ans: "30 hours", exp: "Net filling rate per hour = 1/10 - 1/15 = (3 - 2)/30 = 1/30. Therefore, the tank fills completely in 30 hours." },
        { q: "What is the angle between the hour hand and minute hand of a clock at 3:30?", a: "70 degrees", b: "75 degrees", c: "80 degrees", d: "90 degrees", ans: "75 degrees", exp: "Formula: |30*H - 5.5*M| = |30(3) - 5.5(30)| = |90 - 165| = 75 degrees." },
        { q: "Find the odd one out among the given options: 27, 64, 125, 144, 216, 343", a: "64", b: "144", c: "216", d: "343", ans: "144", exp: "27 (3^3), 64 (4^3), 125 (5^3), 216 (6^3), 343 (7^3) are perfect cubes. 144 is 12^2 (a square, not a cube of an integer)." }
      ]
    }
  ];

  // Repeat and expand variations to build over 180 comprehensive, high quality questions
  let idCounter = 1;
  categoryTemplates.forEach(template => {
    template.topics.forEach((topic, idx) => {
      const diff = template.diffs[idx % template.diffs.length];
      allGenerated.push({
        category: template.cat,
        subcategory: template.sub,
        difficulty: diff,
        question_text: topic.q,
        option_a: topic.a,
        option_b: topic.b,
        option_c: topic.c,
        option_d: topic.d,
        correct_answer: topic.ans,
        explanation: topic.exp
      });
    });
  });

  // Expand with additional in-depth questions across CS Core and Programming
  const extraPool = [
    // Python & Backend
    { category: "Python & Backend", subcategory: "Python Core", difficulty: "Easy", question_text: "What is the Global Interpreter Lock (GIL) in CPython?", option_a: "A security firewall for python scripts", option_b: "A mutex that prevents multiple native threads from executing Python bytecodes simultaneously in CPython", option_c: "A database connection lock", option_d: "A package manager", correct_answer: "A mutex that prevents multiple native threads from executing Python bytecodes simultaneously in CPython", explanation: "The GIL protects CPython's memory management from thread-safety issues, meaning multi-threading is limited to one core for CPU-bound tasks in standard Python." },
    { category: "Python & Backend", subcategory: "Data Structures", difficulty: "Easy", question_text: "Which Python built-in data type is immutable?", option_a: "List", option_b: "Dictionary", option_c: "Tuple", option_d: "Set", correct_answer: "Tuple", explanation: "Tuples, strings, and integers are immutable in Python; their contents cannot be modified in place after creation." },
    { category: "Python & Backend", subcategory: "Generators", difficulty: "Medium", question_text: "What does the `yield` keyword in a Python function do?", option_a: "Terminates the program with exit code 0", option_b: "Pauses function execution and returns a generator iterator value, retaining local variable state for subsequent `next()` calls", option_c: "Declares a global variable", option_d: "Imports a module dynamically", correct_answer: "Pauses function execution and returns a generator iterator value, retaining local variable state for subsequent `next()` calls", explanation: "`yield` transforms a standard function into a memory-efficient generator that produces values on-demand (lazy evaluation)." },
    { category: "Python & Backend", subcategory: "Decorators", difficulty: "Medium", question_text: "What is a Decorator in Python?", option_a: "A CSS stylesheet parser", option_b: "A higher-order function that takes another function as an argument, extends its behavior without modifying it, and returns a new function", option_c: "A class destructor method", option_d: "A type annotation syntax", correct_answer: "A higher-order function that takes another function as an argument, extends its behavior without modifying it, and returns a new function", explanation: "Decorators (e.g. `@login_required`, `@functools.lru_cache`) wrap functions to add cross-cutting functionality elegantly." },
    { category: "Python & Backend", subcategory: "FastAPI / Flask", difficulty: "Medium", question_text: "What is WSGI / ASGI in Python web development?", option_a: "SQL query engines", option_b: "Standard specifications for web servers to communicate with Python web applications (WSGI synchronous, ASGI asynchronous)", option_c: "Python code formatters", option_d: "SSL certificate generators", correct_answer: "Standard specifications for web servers to communicate with Python web applications (WSGI synchronous, ASGI asynchronous)", explanation: "WSGI (Gunicorn/Flask) and ASGI (Uvicorn/FastAPI) standardize server-to-framework communication." },
    
    // Cloud & DevOps
    { category: "Cloud & DevOps", subcategory: "Docker & Containers", difficulty: "Easy", question_text: "What is the key difference between a Docker Container and a Virtual Machine (VM)?", option_a: "VMs are lighter than containers", option_b: "Containers share the host OS kernel and isolate user space, whereas VMs virtualize full hardware and run a complete guest OS", option_c: "Containers cannot run Linux", option_d: "Docker containers require specialized hardware CPUs", correct_answer: "Containers share the host OS kernel and isolate user space, whereas VMs virtualize full hardware and run a complete guest OS", explanation: "Containers are lightweight and start in milliseconds because they leverage host kernel cgroups and namespaces without guest OS overhead." },
    { category: "Cloud & DevOps", subcategory: "Kubernetes", difficulty: "Medium", question_text: "What is a 'Pod' in Kubernetes?", option_a: "A physical data center rack", option_b: "The smallest deployable computing unit in Kubernetes, encapsulating one or more containers sharing network IP and storage", option_c: "A Docker image registry", option_d: "A DNS nameserver", correct_answer: "The smallest deployable computing unit in Kubernetes, encapsulating one or more containers sharing network IP and storage", explanation: "Pods represent running processes on a cluster, co-locating tightly coupled containers that share localhost networking." },
    { category: "Cloud & DevOps", subcategory: "CI/CD", difficulty: "Easy", question_text: "What is Continuous Integration (CI)?", option_a: "Manually deploying code to production servers on weekends", option_b: "The practice of frequently merging code changes into a central repository, automated by automated builds and unit test suites", option_c: "Writing code without testing", option_d: "Buying more cloud servers", correct_answer: "The practice of frequently merging code changes into a central repository, automated by automated builds and unit test suites", explanation: "CI ensures early bug detection by running automated compilation, linting, and unit tests whenever pull requests are opened." },
    { category: "Cloud & DevOps", subcategory: "Kubernetes Services", difficulty: "Medium", question_text: "Which Kubernetes Service type exposes the service externally on each Node's IP at a static port?", option_a: "ClusterIP", option_b: "NodePort", option_c: "ExternalName", option_d: "IngressController", correct_answer: "NodePort", explanation: "NodePort allocates a dedicated port across all cluster nodes (default range 30000-32767) to proxy external traffic to pods." },
    { category: "Cloud & DevOps", subcategory: "Infrastructure as Code", difficulty: "Medium", question_text: "What is the primary benefit of Infrastructure as Code (IaC) tools like Terraform?", option_a: "Writing frontend HTML templates", option_b: "Provisioning and managing cloud infrastructure declaratively using version-controlled configuration files", option_c: "Replacing relational SQL databases", option_d: "Encrypting browser cookies", correct_answer: "Provisioning and managing cloud infrastructure declaratively using version-controlled configuration files", explanation: "IaC enables repeatable, automated, and auditable cloud infrastructure deployments across environments." },
    
    // Cyber Security & Auth
    { category: "Cyber Security & Auth", subcategory: "Web Security", difficulty: "Medium", question_text: "How do Parameterized Queries (Prepared Statements) prevent SQL Injection attacks?", option_a: "By encoding all SQL queries in base64", option_b: "By separating SQL code logic from user data parameters, ensuring user input is treated strictly as literal values rather than executable code", option_c: "By disabling all database read operations", option_d: "By running SQL queries in client browser memory", correct_answer: "By separating SQL code logic from user data parameters, ensuring user input is treated strictly as literal values rather than executable code", explanation: "Prepared statements pre-compile the SQL statement template on the DB engine; user inputs are bound as parameters without altering the syntax tree." },
    { category: "Cyber Security & Auth", subcategory: "XSS & CSRF", difficulty: "Medium", question_text: "What is Cross-Site Scripting (XSS)?", option_a: "A database transaction deadlock", option_b: "A vulnerability where malicious executable JavaScript code is injected into benign websites and executed in the victims' browsers", option_c: "An invalid CSS font declaration", option_d: "A physical network cable breach", correct_answer: "A vulnerability where malicious executable JavaScript code is injected into benign websites and executed in the victims' browsers", explanation: "XSS allows attackers to execute rogue JS scripts in users' browsers, stealing session cookies, tokens, or defacing content." },
    { category: "Cyber Security & Auth", subcategory: "JWT & OAuth2", difficulty: "Medium", question_text: "What are the three dot-separated components of a JSON Web Token (JWT)?", option_a: "Username, Password, Salt", option_b: "Header (algorithm/type), Payload (claims), and Signature (cryptographic verification)", option_c: "Source, Destination, Checksum", option_d: "Key, Value, Timestamp", correct_answer: "Header (algorithm/type), Payload (claims), and Signature (cryptographic verification)", explanation: "A JWT consists of `header.payload.signature` encoded in Base64URL, allowing stateless verification of claims using a secret or public key." },
    { category: "Cyber Security & Auth", subcategory: "Password Hashing", difficulty: "Easy", question_text: "Why should passwords never be stored using simple fast hashing algorithms like MD5 or SHA-256?", option_a: "MD5 and SHA-256 cannot hash strings longer than 10 characters", option_b: "They are designed for speed, making them highly vulnerable to brute-force and GPU rainbow table cracking; slow salted algorithms like bcrypt/Argon2 are required", option_c: "They require paid software licenses", option_d: "They only work on Linux servers", correct_answer: "They are designed for speed, making them highly vulnerable to brute-force and GPU rainbow table cracking; slow salted algorithms like bcrypt/Argon2 are required", explanation: "Modern GPUs can compute billions of SHA-256 hashes per second. Adaptive work-factor algorithms like bcrypt intentionally consume CPU time and unique salts to thwart cracking." },
    { category: "Cyber Security & Auth", subcategory: "HTTPS & Certificates", difficulty: "Medium", question_text: "What is a Man-In-The-Middle (MITM) attack, and how does HTTPS prevent it?", option_a: "A physical robbery at an office; prevented by security guards", option_b: "An attacker intercepts and alters communications between client and server; prevented by TLS cryptographic encryption and Certificate Authority (CA) validation", option_c: "A hard drive failure; prevented by RAID", option_d: "An invalid SQL syntax error; prevented by ORMs", correct_answer: "An attacker intercepts and alters communications between client and server; prevented by TLS cryptographic encryption and Certificate Authority (CA) validation", explanation: "TLS ensures that data exchanged is encrypted end-to-end and signed by trusted certificate authorities, preventing eavesdropping and tampering." }
  ];

  extraPool.forEach(item => {
    allGenerated.push(item);
  });

  return allGenerated;
}

async function seed() {
  try {
    console.log("🌱 Connecting to PostgreSQL to seed interview questions...");
    const allQuestions = generateCompleteQuestionBank();
    console.log(`📋 Total generated questions to insert: ${allQuestions.length}`);

    let insertedCount = 0;
    for (const q of allQuestions) {
      // Check if duplicate question exists
      const checkRes = await pool.query(
        `SELECT id FROM questions WHERE question_text = $1 LIMIT 1;`,
        [q.question_text]
      );

      if (checkRes.rows.length === 0) {
        await pool.query(
          `INSERT INTO questions (category, subcategory, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [q.category, q.subcategory, q.difficulty, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.explanation]
        );
        insertedCount++;
      }
    }

    const totalCountRes = await pool.query(`SELECT COUNT(*) as total FROM questions;`);
    console.log(`✅ Success! Inserted ${insertedCount} new questions.`);
    console.log(`🎉 Total questions now in Question Bank: ${totalCountRes.rows[0].total}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
}

seed();
