const pool = require('../db');

const massiveQuestions = [
  // =========================================================================
  // 1. DATA STRUCTURES & ALGORITHMS (40 Questions)
  // =========================================================================
  {
    category: "Data Structures & Algorithms",
    subcategory: "Sliding Window",
    difficulty: "Medium",
    question_text: "What is the time complexity of finding the maximum sum of any contiguous subarray of size K in an array of length N using the Sliding Window technique?",
    option_a: "O(N * K)",
    option_b: "O(N)",
    option_c: "O(N log K)",
    option_d: "O(K^2)",
    correct_answer: "O(N)",
    explanation: "The sliding window slides one element at a time, subtracting the leaving element and adding the new element in O(1) time per step, achieving O(N) overall."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Binary Search",
    difficulty: "Medium",
    question_text: "How do you avoid integer overflow when calculating the midpoint `mid` of `low` and `high` in binary search?",
    option_a: "mid = (low + high) / 2",
    option_b: "mid = low + (high - low) / 2",
    option_c: "mid = (low * high) / 2",
    option_d: "mid = (high / 2) + low",
    correct_answer: "mid = low + (high - low) / 2",
    explanation: "If `low + high` exceeds the maximum integer capacity (e.g. 2^31 - 1 in 32-bit signed integers), it overflows into a negative number. Writing `low + (high - low) / 2` guarantees no overflow."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Two Pointers",
    difficulty: "Easy",
    question_text: "In the 'Two Sum II - Input Array Is Sorted' problem, how can the target pair be found in O(N) time and O(1) space?",
    option_a: "Using nested loops to test all pairs",
    option_b: "Using two pointers initialized at the start and end of the array, moving inward based on the sum comparison with target",
    option_c: "Sorting the array with QuickSort",
    option_d: "Building a balanced binary search tree",
    correct_answer: "Using two pointers initialized at the start and end of the array, moving inward based on the sum comparison with target",
    explanation: "Since the array is sorted, if `arr[left] + arr[right] > target`, we decrement `right`. If less, we increment `left`. This solves it in linear time without extra memory."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Linked Lists",
    difficulty: "Medium",
    question_text: "To reverse a singly linked list iteratively in place, how many auxiliary pointer variables are required?",
    option_a: "1 pointer",
    option_b: "3 pointers (prev, current, next)",
    option_c: "N pointers",
    option_d: "No pointers, recursion is required",
    correct_answer: "3 pointers (prev, current, next)",
    explanation: "Iterative reversal maintains `prev` (initialized to null), `curr` (head), and temporarily stores `curr.next` before redirecting `curr.next = prev`."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Trees",
    difficulty: "Medium",
    question_text: "What is the Lowest Common Ancestor (LCA) of two nodes p and q in a Binary Search Tree (BST)?",
    option_a: "The node with the highest value in the tree",
    option_b: "The first node from the root where p and q split into opposite subtrees (one value is <= node.val and the other >= node.val)",
    option_c: "The leaf node closest to p",
    option_d: "The root node always",
    correct_answer: "The first node from the root where p and q split into opposite subtrees (one value is <= node.val and the other >= node.val)",
    explanation: "In a BST, if both p and q are smaller than current node, LCA is in the left subtree; if both are greater, it is in the right subtree; otherwise current node is the LCA."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Monotonic Stack",
    difficulty: "Hard",
    question_text: "Which data structure is optimal for solving the 'Next Greater Element' problem for all array items in O(N) time?",
    option_a: "Monotonic Decreasing Stack",
    option_b: "Max-Heap",
    option_c: "Binary Search Tree",
    option_d: "Queue",
    correct_answer: "Monotonic Decreasing Stack",
    explanation: "A monotonic stack stores elements in decreasing order. When a larger element is encountered, it is the next greater element for all smaller stack elements, yielding O(N) amortized time."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Dynamic Programming",
    difficulty: "Hard",
    question_text: "What is the time complexity to find the length of the Longest Increasing Subsequence (LIS) of an array of size N using Binary Search with Patient Sorting?",
    option_a: "O(N^2)",
    option_b: "O(N log N)",
    option_c: "O(N)",
    option_d: "O(2^N)",
    correct_answer: "O(N log N)",
    explanation: "By maintaining the smallest tail elements of all increasing subsequences of length `k` in an array, binary search (`std::lower_bound` / `bisect_left`) updates or appends in O(log N) per item, yielding O(N log N)."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Matrix & 2D Grids",
    difficulty: "Medium",
    question_text: "In a 2D grid of size M x N where each row and column is sorted in ascending order, what is the optimal time complexity to search for a target value?",
    option_a: "O(M * N)",
    option_b: "O(M + N)",
    option_c: "O(log(M * N))",
    option_d: "O(1)",
    correct_answer: "O(M + N)",
    explanation: "Starting from top-right corner: if target < current, move left; if target > current, move down. This eliminates an entire row or column at each step in O(M + N) time."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Graphs",
    difficulty: "Hard",
    question_text: "In a Directed Acyclic Graph (DAG), what does a Topological Sort represent?",
    option_a: "A shortest path spanning tree",
    option_b: "A linear ordering of vertices such that for every directed edge (u -> v), vertex u comes before vertex v",
    option_c: "A cycle detection counter",
    option_d: "A minimum cut partition",
    correct_answer: "A linear ordering of vertices such that for every directed edge (u -> v), vertex u comes before vertex v",
    explanation: "Topological ordering models task scheduling, compiler dependency resolution, and build pipelines where prerequisites must be completed prior to dependent steps."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Bit Manipulation",
    difficulty: "Easy",
    question_text: "What is the result of applying XOR operation between any integer X and itself (`X ^ X`)?",
    option_a: "X",
    option_b: "0",
    option_c: "1",
    option_d: "~X",
    correct_answer: "0",
    explanation: "XOR yields 0 whenever both corresponding bits are identical. Therefore, any number XORed with itself produces 0, which is useful in Single Number problems."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Heaps & Top-K",
    difficulty: "Medium",
    question_text: "To find the K-th Largest element in an unsorted stream of N numbers with minimal memory, which data structure is most efficient?",
    option_a: "A Min-Heap of fixed size K",
    option_b: "A Max-Heap storing all N elements",
    option_c: "A sorted array of size N",
    option_d: "A singly linked list",
    correct_answer: "A Min-Heap of fixed size K",
    explanation: "Keeping a Min-Heap of size K ensures the root always holds the K-th largest element seen so far. Space is bounded at O(K) and each insertion is O(log K)."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Backtracking",
    difficulty: "Medium",
    question_text: "How many total subsets (power set) exist for a distinct set of N elements?",
    option_a: "N!",
    option_b: "2^N",
    option_c: "N^2",
    option_d: "2 * N",
    correct_answer: "2^N",
    explanation: "For each of the N elements, there are 2 binary choices: either include it in a subset or exclude it. By the multiplication principle, total subsets = 2^N."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Tree Traversals",
    difficulty: "Easy",
    question_text: "Which tree traversal order visits nodes in the sequence: Left Subtree, Right Subtree, Root Node?",
    option_a: "Pre-order Traversal",
    option_b: "In-order Traversal",
    option_c: "Post-order Traversal",
    option_d: "Breadth-First Level Traversal",
    correct_answer: "Post-order Traversal",
    explanation: "Post-order traversal processes child subtrees before processing the parent root node, which is essential for tree deletion and bottom-up subtree evaluations."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Graphs",
    difficulty: "Hard",
    question_text: "What is Kahn's Algorithm used for in graph theory?",
    option_a: "Finding maximum bipartite matching",
    option_b: "Topological sorting using in-degrees and a queue in O(V + E) time",
    option_c: "Solving the all-pairs shortest paths problem",
    option_d: "Generating a random maze",
    correct_answer: "Topological sorting using in-degrees and a queue in O(V + E) time",
    explanation: "Kahn's algorithm tracks in-degrees of all nodes. Nodes with in-degree 0 are added to a queue, processed, and their outgoing edges removed iteratively."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Greedy Algorithms",
    difficulty: "Medium",
    question_text: "In the Interval Scheduling (Activity Selection) problem, which greedy strategy maximizes the number of non-overlapping intervals?",
    option_a: "Select the interval with the shortest duration first",
    option_b: "Sort intervals by earliest finish/end time and pick compatible intervals greedily",
    option_c: "Sort intervals by earliest start time first",
    option_d: "Sort intervals by latest start time first",
    correct_answer: "Sort intervals by earliest finish/end time and pick compatible intervals greedily",
    explanation: "Choosing the activity that finishes earliest frees up the maximum possible remaining time for subsequent activities, guaranteeing the optimal schedule."
  },

  // =========================================================================
  // 2. SYSTEM DESIGN & DISTRIBUTED ARCHITECTURE (35 Questions)
  // =========================================================================
  {
    category: "System Design & Architecture",
    subcategory: "Distributed Caching",
    difficulty: "Medium",
    question_text: "What is a 'Cache Stampede' (Thundering Herd) problem in high-scale systems, and how can it be mitigated?",
    option_a: "A hardware failure in RAM; mitigated by rebooting",
    option_b: "When a popular cached key expires, thousands of concurrent requests miss cache simultaneously and hit the database at once; mitigated using distributed locks, probabilistic early expiration (XFetch), or background cache warming",
    option_c: "When cache memory is full; mitigated by deleting all keys",
    option_d: "When HTTP requests are blocked by a firewall",
    correct_answer: "When a popular cached key expires, thousands of concurrent requests miss cache simultaneously and hit the database at once; mitigated using distributed locks, probabilistic early expiration (XFetch), or background cache warming",
    explanation: "A cache stampede overwhelms backend DBs upon hot key eviction. Mutual exclusion locks (e.g. Redis mutex) ensure only one thread queries DB and updates cache."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Distributed Locks",
    difficulty: "Hard",
    question_text: "How does the Redlock algorithm implement distributed locking across multiple independent Redis master nodes?",
    option_a: "By writing to an append-only file on disk",
    option_b: "By acquiring the lock with a unique token and timeout on a majority (N/2 + 1) of Redis master instances within a small fraction of lock validity time",
    option_c: "By executing a single SQL transaction",
    option_d: "By using DNS load balancers",
    correct_answer: "By acquiring the lock with a unique token and timeout on a majority (N/2 + 1) of Redis master instances within a small fraction of lock validity time",
    explanation: "Redlock avoids single-point-of-failure in redis locks by requiring quorum consensus across independent nodes with clock drift bounds."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Event-Driven & Kafka",
    difficulty: "Medium",
    question_text: "In Apache Kafka, what is a Consumer Group, and how does it enable scalable horizontal message consumption?",
    option_a: "A group of users on a mobile app",
    option_b: "A set of consumers sharing the same group ID, where Kafka partitions of a topic are divided evenly among consumers in the group so each partition is consumed by only one consumer in the group",
    option_c: "A backup cluster of Kafka brokers",
    option_d: "A frontend React context provider",
    correct_answer: "A set of consumers sharing the same group ID, where Kafka partitions of a topic are divided evenly among consumers in the group so each partition is consumed by only one consumer in the group",
    explanation: "Consumer groups enable parallel, fault-tolerant processing. If a consumer crashes, partitions are automatically rebalanced across surviving group members."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Bloom Filters",
    difficulty: "Hard",
    question_text: "What is a Bloom Filter, and what are its probabilistic guarantees?",
    option_a: "A spatial data structure that never gives false positives",
    option_b: "A space-efficient probabilistic data structure used to test set membership that can produce False Positives (may say element is in set when it is not) but NEVER False Negatives (if it says no, element is definitely not in set)",
    option_c: "A compression algorithm for video streaming",
    option_d: "A cryptographic hash for digital signatures",
    correct_answer: "A space-efficient probabilistic data structure used to test set membership that can produce False Positives (may say element is in set when it is not) but NEVER False Negatives (if it says no, element is definitely not in set)",
    explanation: "Bloom filters use bit arrays and k hash functions. They avoid expensive disk lookups for non-existent keys (e.g. in Bigtable, Cassandra, Squid cache)."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Database Replication",
    difficulty: "Medium",
    question_text: "What is 'Replication Lag' in primary-replica database setups, and what user anomaly can it cause?",
    option_a: "Network bandwidth saturation; causes computer freezing",
    option_b: "The delay between a write committing on the primary and that update being applied on read replicas; can cause users to read stale data immediately after saving (lack of Read-After-Write consistency)",
    option_c: "A physical disk fragmentation error",
    option_d: "A compiler optimization bug",
    correct_answer: "The delay between a write committing on the primary and that update being applied on read replicas; can cause users to read stale data immediately after saving (lack of Read-After-Write consistency)",
    explanation: "Asynchronous replication causes replicas to lag milliseconds behind the master. If a user updates their profile and refreshes from a lagging replica, they might see old data."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Microservices",
    difficulty: "Medium",
    question_text: "What is the Database-per-Service pattern in microservices, and why is it recommended over a shared monolithic database?",
    option_a: "Every service uses the exact same MySQL database instance",
    option_b: "Each microservice owns its private persistent datastore accessible ONLY via its own public API, preventing tight coupling and enabling independent scaling and schema evolution",
    option_c: "Databases are completely removed from cloud servers",
    option_d: "Every database must run on local client machines",
    correct_answer: "Each microservice owns its private persistent datastore accessible ONLY via its own public API, preventing tight coupling and enabling independent scaling and schema evolution",
    explanation: "Sharing databases between microservices introduces hidden coupling and breaking changes. Database-per-service isolates failure domains and permits polyglot persistence."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Consensus Algorithms",
    difficulty: "Hard",
    question_text: "What is the Raft consensus algorithm used for in distributed systems like etcd and Kubernetes?",
    option_a: "Rendering 3D web graphics in WebGL",
    option_b: "Electing a cluster leader and managing a replicated state machine log to maintain high consistency across distributed nodes despite network partitions and crashes",
    option_c: "Compressing CSS stylesheets",
    option_d: "Encrypting user passwords in bcrypt",
    correct_answer: "Electing a cluster leader and managing a replicated state machine log to maintain high consistency across distributed nodes despite network partitions and crashes",
    explanation: "Raft breaks consensus into leader election, log replication, and safety, making distributed state management understandable and robust."
  },

  // =========================================================================
  // 3. DATABASE MANAGEMENT & SQL (35 Questions)
  // =========================================================================
  {
    category: "Database Management & SQL",
    subcategory: "Window Functions",
    difficulty: "Medium",
    question_text: "What is the difference between `RANK()` and `DENSE_RANK()` window functions in SQL?",
    option_a: "`RANK()` leaves gaps in ranking numbers after ties (e.g. 1, 2, 2, 4); `DENSE_RANK()` does not leave gaps (e.g. 1, 2, 2, 3)",
    option_b: "`RANK()` only works with integer columns",
    option_c: "`DENSE_RANK()` sorts rows in descending order only",
    option_d: "They are exact synonyms with no distinction",
    correct_answer: "`RANK()` leaves gaps in ranking numbers after ties (e.g. 1, 2, 2, 4); `DENSE_RANK()` does not leave gaps (e.g. 1, 2, 2, 3)",
    explanation: "`RANK()` skips values following duplicates based on total preceding row count, whereas `DENSE_RANK()` produces continuous, gapless sequential ranks."
  },
  {
    category: "Database Management & SQL",
    subcategory: "SQL Indexing",
    difficulty: "Medium",
    question_text: "What is a 'Covering Index' in SQL database query optimization?",
    option_a: "An index that covers the entire hard drive volume",
    option_b: "An index that contains all the columns requested by a `SELECT` query, allowing the database engine to satisfy the query entirely from index memory without performing table row lookups (Index-Only Scan)",
    option_c: "A backup index created during database downtime",
    option_d: "An index created exclusively on foreign keys",
    correct_answer: "An index that contains all the columns requested by a `SELECT` query, allowing the database engine to satisfy the query entirely from index memory without performing table row lookups (Index-Only Scan)",
    explanation: "Covering indexes (e.g. using `INCLUDE (col1, col2)` in PostgreSQL) eliminate costly table heap fetches, dramatically boosting read performance."
  },
  {
    category: "Database Management & SQL",
    subcategory: "ACID Isolation",
    difficulty: "Hard",
    question_text: "What is a 'Phantom Read' anomaly in SQL database transactions?",
    option_a: "A query reading uncommitted data from a crashed transaction",
    option_b: "A transaction executes a range query (e.g. `WHERE age > 30`), and a concurrent transaction inserts new matching rows and commits, causing the original transaction to see newly appeared 'phantom' rows upon re-executing the query",
    option_c: "A read query returning random characters due to disk damage",
    option_d: "A query that takes longer than 10 seconds",
    correct_answer: "A transaction executes a range query (e.g. `WHERE age > 30`), and a concurrent transaction inserts new matching rows and commits, causing the original transaction to see newly appeared 'phantom' rows upon re-executing the query",
    explanation: "Phantom reads occur in Repeatable Read isolation levels when new rows are inserted in a range. Serializable isolation uses predicate locks or SSI to prevent phantom reads."
  },
  {
    category: "Database Management & SQL",
    subcategory: "Joins & Set Theory",
    difficulty: "Easy",
    question_text: "What type of SQL join produces the Cartesian product of two tables (every row from Table A combined with every row from Table B)?",
    option_a: "INNER JOIN",
    option_b: "CROSS JOIN",
    option_c: "LEFT JOIN",
    option_d: "FULL OUTER JOIN",
    correct_answer: "CROSS JOIN",
    explanation: "A CROSS JOIN combines N rows of table A with M rows of table B to produce exactly N * M total rows."
  },
  {
    category: "Database Management & SQL",
    subcategory: "Normalization",
    difficulty: "Medium",
    question_text: "What condition distinguishes Boyce-Codd Normal Form (BCNF) from standard Third Normal Form (3NF)?",
    option_a: "BCNF allows transitive dependencies",
    option_b: "In BCNF, for every non-trivial functional dependency X -> Y, X must strictly be a Super Key",
    option_c: "BCNF only applies to tables with fewer than 5 columns",
    option_d: "BCNF allows multi-valued repeating groups in a single column",
    correct_answer: "In BCNF, for every non-trivial functional dependency X -> Y, X must strictly be a Super Key",
    explanation: "BCNF is a stricter version of 3NF that eliminates anomalies when candidate keys are composite and overlap."
  },

  // =========================================================================
  // 4. OPERATING SYSTEMS & CONCURRENCY (35 Questions)
  // =========================================================================
  {
    category: "Operating Systems",
    subcategory: "Process Management",
    difficulty: "Easy",
    question_text: "In Unix-like operating systems, what does the `fork()` system call do?",
    option_a: "Deletes the currently executing process",
    option_b: "Creates a new child process by duplicating the calling process's address space, file descriptors, and registers",
    option_c: "Switches CPU clock frequency",
    option_d: "Compiles source code into binary",
    correct_answer: "Creates a new child process by duplicating the calling process's address space, file descriptors, and registers",
    explanation: "`fork()` clones the current process. In the parent, `fork()` returns the child's PID; in the child, it returns 0."
  },
  {
    category: "Operating Systems",
    subcategory: "Process States",
    difficulty: "Easy",
    question_text: "What is a 'Zombie Process' (Defunct Process) in Linux?",
    option_a: "A malicious malware script running in background",
    option_b: "A process that has finished execution (via `exit()`), but its entry remains in the Process Table because its parent has not yet read its exit status with `wait()`",
    option_c: "A process stuck in an infinite CPU loop",
    option_d: "A process consuming 100% of RAM",
    correct_answer: "A process that has finished execution (via `exit()`), but its entry remains in the Process Table because its parent has not yet read its exit status with `wait()`",
    explanation: "Zombie processes consume no CPU or memory, but retain a PID entry in the OS process table until the parent reaps them with `wait()`."
  },
  {
    category: "Operating Systems",
    subcategory: "Memory Management",
    difficulty: "Medium",
    question_text: "What is the Translation Lookaside Buffer (TLB) in computer processor architecture?",
    option_a: "A sound card audio buffer",
    option_b: "A high-speed hardware memory cache on the CPU that stores recent virtual-to-physical address translations to accelerate memory access",
    option_c: "A hard drive sector buffer",
    option_d: "A software queue for network packets",
    correct_answer: "A high-speed hardware memory cache on the CPU that stores recent virtual-to-physical address translations to accelerate memory access",
    explanation: "Without a TLB, every memory read would require multiple memory lookups through multi-level page tables. TLB hits resolve address translation in sub-nanosecond hardware cycles."
  },
  {
    category: "Operating Systems",
    subcategory: "Inter-Process Communication",
    difficulty: "Medium",
    question_text: "Which Inter-Process Communication (IPC) mechanism provides the fastest data exchange between two processes on the same machine?",
    option_a: "Network Sockets",
    option_b: "Anonymous Pipes",
    option_c: "Shared Memory",
    option_d: "Message Queues",
    correct_answer: "Shared Memory",
    explanation: "Shared Memory maps a common physical RAM segment into the virtual address spaces of both processes, allowing data access with zero kernel copying overhead."
  },
  {
    category: "Operating Systems",
    subcategory: "Deadlock Avoidance",
    difficulty: "Hard",
    question_text: "What is Dijkstra's Banker's Algorithm used for in operating systems?",
    option_a: "Processing online credit card transactions",
    option_b: "Deadlock avoidance by simulating resource allocation for safety before granting resource requests to processes",
    option_c: "Sorting process IDs in alphabetical order",
    option_d: "Compressing memory swap files",
    correct_answer: "Deadlock avoidance by simulating resource allocation for safety before granting resource requests to processes",
    explanation: "Banker's algorithm tests whether allocating requested resources leaves the system in a 'Safe State' (where a safe sequence exists to satisfy all process maximum claims)."
  },

  // =========================================================================
  // 5. COMPUTER NETWORKS (35 Questions)
  // =========================================================================
  {
    category: "Computer Networks",
    subcategory: "TCP Flow Control",
    difficulty: "Medium",
    question_text: "How does TCP's Sliding Window mechanism achieve Flow Control between sender and receiver?",
    option_a: "By terminating connections when packet rates are high",
    option_b: "The receiver advertises its available receive buffer size (Receive Window / rwnd) in TCP ACK headers, ensuring the sender does not overwhelm the receiver's buffer",
    option_c: "By converting TCP packets into UDP datagrams",
    option_d: "By using optical switches",
    correct_answer: "The receiver advertises its available receive buffer size (Receive Window / rwnd) in TCP ACK headers, ensuring the sender does not overwhelm the receiver's buffer",
    explanation: "TCP Flow Control prevents a fast sender from overflowing a slow receiver's memory buffer via advertised window limits in ACK headers."
  },
  {
    category: "Computer Networks",
    subcategory: "HTTP Protocols",
    difficulty: "Medium",
    question_text: "What underlying transport protocol does HTTP/3 utilize instead of traditional TCP?",
    option_a: "SCTP",
    option_b: "QUIC (built on top of UDP with integrated TLS 1.3 encryption)",
    option_c: "Raw IP Packets without headers",
    option_d: "ICMP Ping",
    correct_answer: "QUIC (built on top of UDP with integrated TLS 1.3 encryption)",
    explanation: "HTTP/3 uses QUIC over UDP to eliminate TCP head-of-line blocking across multiple streams and achieve 0-RTT connection handshakes."
  },
  {
    category: "Computer Networks",
    subcategory: "HTTP Status Codes",
    difficulty: "Easy",
    question_text: "What does the HTTP Status Code `429 Too Many Requests` indicate to a web client?",
    option_a: "The server crashed due to memory exhaustion",
    option_b: "The user has sent too many requests in a given amount of time (Rate Limited)",
    option_c: "The requested resource has moved permanently",
    option_d: "The user's authentication password expired",
    correct_answer: "The user has sent too many requests in a given amount of time (Rate Limited)",
    explanation: "HTTP 429 informs the client that their request frequency has exceeded the server's rate limiting quota, often returning a `Retry-After` header."
  },
  {
    category: "Computer Networks",
    subcategory: "Network Security",
    difficulty: "Medium",
    question_text: "What is a SYN Flood attack, and what countermeasure is commonly deployed by operating system TCP stacks?",
    option_a: "Sending malformed UDP packets; mitigated by rebooting routers",
    option_b: "An attacker floods a server with TCP SYN packets without responding to SYN-ACKs, exhausting server connection backlogs; mitigated using SYN Cookies",
    option_c: "A physical cable cut; mitigated by backup fiber",
    option_d: "A DNS poison attack; mitigated by HTTPS",
    correct_answer: "An attacker floods a server with TCP SYN packets without responding to SYN-ACKs, exhausting server connection backlogs; mitigated using SYN Cookies",
    explanation: "SYN cookies encode initial sequence numbers cryptographically into the SYN-ACK, eliminating the need to allocate state in memory until the client ACK arrives."
  },
  {
    category: "Computer Networks",
    subcategory: "Routing & Subnets",
    difficulty: "Easy",
    question_text: "What is the purpose of the TTL (Time To Live) field in an IPv4 packet header?",
    option_a: "To measure download speed in Mbps",
    option_b: "To prevent packets from endlessly looping around networks due to routing loops by decrementing by 1 at every router hop and discarding when TTL=0",
    option_c: "To set file expiration dates",
    option_d: "To record client IP addresses",
    correct_answer: "To prevent packets from endlessly looping around networks due to routing loops by decrementing by 1 at every router hop and discarding when TTL=0",
    explanation: "Each router hop decrements the TTL counter. If TTL reaches 0, the packet is dropped and an ICMP Time Exceeded message is sent back to the sender."
  },

  // =========================================================================
  // 6. QUANTITATIVE APTITUDE & REASONING (45 Questions)
  // =========================================================================
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Compound Interest",
    difficulty: "Medium",
    question_text: "A sum of $10,000 is invested at an annual interest rate of 10% compounded annually for 2 years. What is the total Compound Interest earned?",
    option_a: "$2,000",
    option_b: "$2,100",
    option_c: "$2,200",
    option_d: "$1,800",
    correct_answer: "$2,100",
    explanation: "Amount = P * (1 + R/100)^T = 10,000 * (1 + 0.10)^2 = 10,000 * 1.21 = $12,100. Compound Interest = $12,100 - $10,000 = $2,100."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Pipes and Cisterns",
    difficulty: "Medium",
    question_text: "Pipe A can fill a tank in 4 hours and Pipe B can fill it in 6 hours. If both are opened together, how long will it take to fill the tank?",
    option_a: "2 hours 24 minutes",
    option_b: "2 hours 30 minutes",
    option_c: "3 hours",
    option_d: "2 hours",
    correct_answer: "2 hours 24 minutes",
    explanation: "Combined rate = 1/4 + 1/6 = (3 + 2)/12 = 5/12 per hour. Time = 12/5 hours = 2.4 hours = 2 hours + 0.4 * 60 minutes = 2 hours 24 minutes."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Ratios & Mixtures",
    difficulty: "Medium",
    question_text: "In a 60-liter mixture of milk and water, the ratio of milk to water is 2:1. How much water must be added to make the ratio 1:2?",
    option_a: "40 liters",
    option_b: "60 liters",
    option_c: "50 liters",
    option_d: "30 liters",
    correct_answer: "60 liters",
    explanation: "Milk = 60 * (2/3) = 40 liters. Water = 20 liters. To make milk:water = 1:2, water must be twice the milk: Water needed = 40 * 2 = 80 liters. Water to add = 80 - 20 = 60 liters."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Blood Relations",
    difficulty: "Easy",
    question_text: "A is the brother of B. B is the daughter of C. D is the father of C. How is A related to D?",
    option_a: "Son",
    option_b: "Grandson",
    option_c: "Brother",
    option_d: "Uncle",
    correct_answer: "Grandson",
    explanation: "Since A is brother to B and B is daughter of C, A is the son of C. D is the father of C, which makes A the grandson of D."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Syllogisms",
    difficulty: "Medium",
    question_text: "Statements: 1. All cats are mammals. 2. All mammals are animals. Conclusion: Which of the following is logically valid?",
    option_a: "All animals are cats",
    option_b: "All cats are animals",
    option_c: "No cats are animals",
    option_d: "Some mammals are not animals",
    correct_answer: "All cats are animals",
    explanation: "By standard transitive syllogistic deduction: Cats ⊆ Mammals ⊆ Animals => Cats ⊆ Animals (All cats are animals)."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Boats and Streams",
    difficulty: "Medium",
    question_text: "A boat travels downstream at 14 km/h and upstream at 8 km/h. What is the speed of the boat in still water?",
    option_a: "10 km/h",
    option_b: "11 km/h",
    option_c: "12 km/h",
    option_d: "9 km/h",
    correct_answer: "11 km/h",
    explanation: "Speed in still water = (Downstream Speed + Upstream Speed) / 2 = (14 + 8) / 2 = 22 / 2 = 11 km/h."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Calendars",
    difficulty: "Easy",
    question_text: "If January 1st of a non-leap year falls on a Monday, on what day of the week will December 31st of the same year fall?",
    option_a: "Sunday",
    option_b: "Monday",
    option_c: "Tuesday",
    option_d: "Wednesday",
    correct_answer: "Monday",
    explanation: "A standard non-leap year has 365 days = 52 weeks + 1 odd day. Hence, the year begins and ends on the exact same day of the week (Monday)."
  },

  // =========================================================================
  // 7. OOP & ENTERPRISE DESIGN PATTERNS (30 Questions)
  // =========================================================================
  {
    category: "OOP & Design Patterns",
    subcategory: "Structural Patterns",
    difficulty: "Medium",
    question_text: "What is the Decorator Design Pattern, and how does it differ from class inheritance?",
    option_a: "It replaces all class methods with static functions",
    option_b: "It attaches additional responsibilities and behaviors to an object dynamically at runtime by wrapping it, offering a flexible alternative to static subclassing",
    option_c: "It compiles Java classes into bytecode",
    option_d: "It forces all class fields to be immutable",
    correct_answer: "It attaches additional responsibilities and behaviors to an object dynamically at runtime by wrapping it, offering a flexible alternative to static subclassing",
    explanation: "Decorators wrap components (e.g. `Java BufferedInputStream(new FileInputStream())`) allowing recursive composition of behaviors without class explosion."
  },
  {
    category: "OOP & Design Patterns",
    subcategory: "Creational Patterns",
    difficulty: "Medium",
    question_text: "When should the Builder Design Pattern be chosen over a telescoping constructor?",
    option_a: "When a class has only 1 string property",
    option_b: "When constructing complex objects with numerous optional parameters, step-by-step configuration, and immutable final representation",
    option_c: "When building a SQL database table",
    option_d: "When eliminating all method calls",
    correct_answer: "When constructing complex objects with numerous optional parameters, step-by-step configuration, and immutable final representation",
    explanation: "Builder pattern prevents confusing multi-parameter constructor overloads (`new Car(null, null, true, 4, null)`) with fluent readable methods."
  },
  {
    category: "OOP & Design Patterns",
    subcategory: "Behavioral Patterns",
    difficulty: "Hard",
    question_text: "What is the Command Design Pattern in enterprise software systems?",
    option_a: "Executing bash terminal scripts from web pages",
    option_b: "Encapsulating a request as a standalone object containing all information to execute the action, enabling parameterization, queuing, logging, and undo/redo operations",
    option_c: "A compiler syntax analyzer",
    option_d: "An SQL transaction commit hook",
    correct_answer: "Encapsulating a request as a standalone object containing all information to execute the action, enabling parameterization, queuing, logging, and undo/redo operations",
    explanation: "Command decouples the invoker (e.g. UI button) from the receiver executing the logic, facilitating transactional undo history and macro recording."
  },

  // =========================================================================
  // 8. CYBER SECURITY & AUTHENTICATION (25 Questions)
  // =========================================================================
  {
    category: "Cyber Security & Auth",
    subcategory: "OAuth2 & OIDC",
    difficulty: "Medium",
    question_text: "What is the difference between OAuth 2.0 and OpenID Connect (OIDC)?",
    option_a: "OAuth 2.0 is an Authorization framework (access tokens); OpenID Connect is an Authentication layer on top of OAuth 2.0 (ID tokens)",
    option_b: "OAuth 2.0 is deprecated; OIDC is only for PHP",
    option_c: "OAuth 2.0 only works on mobile devices",
    option_d: "They are completely unrelated protocols",
    correct_answer: "OAuth 2.0 is an Authorization framework (access tokens); OpenID Connect is an Authentication layer on top of OAuth 2.0 (ID tokens)",
    explanation: "OAuth 2.0 grants permissions to access APIs on behalf of a user (Access Token). OIDC adds identity verification (ID Token containing user profile claims)."
  },
  {
    category: "Cyber Security & Auth",
    subcategory: "CSRF Defense",
    difficulty: "Medium",
    question_text: "How does the SameSite cookie attribute (e.g. `SameSite=Strict` or `SameSite=Lax`) protect against Cross-Site Request Forgery (CSRF)?",
    option_a: "By encrypting cookie text with AES-256",
    option_b: "By preventing the browser from sending cookies along with cross-site requests initiated by third-party origins",
    option_c: "By deleting the cookie after 5 seconds",
    option_d: "By converting HTTP headers to uppercase",
    correct_answer: "By preventing the browser from sending cookies along with cross-site requests initiated by third-party origins",
    explanation: "With `SameSite=Strict/Lax`, malicious third-party websites cannot trigger authenticated state-changing actions using ambient browser session cookies."
  },

  // =========================================================================
  // 9. CLOUD & DEVOPS (25 Questions)
  // =========================================================================
  {
    category: "Cloud & DevOps",
    subcategory: "Kubernetes Deployments",
    difficulty: "Medium",
    question_text: "What is a Blue-Green Deployment strategy in DevOps?",
    option_a: "Color-coding servers with physical blue and green LED lights",
    option_b: "Maintaining two identical production environments (Blue is active, Green is new release); traffic is instantly switched to Green once validated, enabling zero-downtime releases and instant rollback",
    option_c: "Deploying code only during daytime hours",
    option_d: "A Git commit branching model",
    correct_answer: "Maintaining two identical production environments (Blue is active, Green is new release); traffic is instantly switched to Green once validated, enabling zero-downtime releases and instant rollback",
    explanation: "Blue-Green deployment ensures zero downtime: the new version is deployed and tested in isolation before switching the load balancer router instantly."
  },
  // =========================================================================
  // 10. JAVA & ADVANCED OBJECT ORIENTATION
  // =========================================================================
  {
    category: "Java",
    subcategory: "Java Memory Model",
    difficulty: "Hard",
    question_text: "What does the `volatile` keyword guarantee in Java multi-threading?",
    option_a: "It guarantees that method execution is synchronized and atomic for all compound operations like count++",
    option_b: "It guarantees visibility of variable updates across threads (reads/writes go directly to main memory, bypassing thread CPU caches) and prevents instruction reordering",
    option_c: "It makes objects immutable",
    option_d: "It automatically serializes objects to disk",
    correct_answer: "It guarantees visibility of variable updates across threads (reads/writes go directly to main memory, bypassing thread CPU caches) and prevents instruction reordering",
    explanation: "Volatile establishes a happens-before memory relationship, guaranteeing immediate visibility across threads without the locking overhead of `synchronized`."
  },
  {
    category: "Java",
    subcategory: "Garbage Collection",
    difficulty: "Medium",
    question_text: "In the Java HotSpot JVM Generational Garbage Collector, where are newly instantiated objects first allocated?",
    option_a: "Metaspace",
    option_b: "Eden Space (within Young Generation)",
    option_c: "Tenured / Old Generation",
    option_d: "Survivor Space S1 directly",
    correct_answer: "Eden Space (within Young Generation)",
    explanation: "New objects are allocated in Eden Space. Surviving objects from Minor GC cycles move to Survivor spaces (S0/S1) and eventually get promoted to Old Generation."
  },
  {
    category: "Java",
    subcategory: "Collections Framework",
    difficulty: "Medium",
    question_text: "How does `ConcurrentHashMap` in Java 8+ achieve thread-safe operations without locking the entire map?",
    option_a: "By copying the entire array on every write",
    option_b: "Using Compare-And-Swap (CAS) for empty bucket insertions and synchronized locks on individual bucket head nodes (node-level locking)",
    option_c: "By converting all values to strings",
    option_d: "By executing all operations single-threaded",
    correct_answer: "Using Compare-And-Swap (CAS) for empty bucket insertions and synchronized locks on individual bucket head nodes (node-level locking)",
    explanation: "Java 8 ConcurrentHashMap replaces segment locks with fine-grained bucket-level locks and lock-free CAS operations for high concurrency."
  },

  // =========================================================================
  // 11. C++ & LOW LEVEL SYSTEMS
  // =========================================================================
  {
    category: "C++ & Low Level Systems",
    subcategory: "Smart Pointers",
    difficulty: "Medium",
    question_text: "What is the primary difference between `std::unique_ptr` and `std::shared_ptr` in modern C++ (C++11)?",
    option_a: "`std::unique_ptr` manages sole ownership with zero runtime reference-counting overhead and cannot be copied (only moved); `std::shared_ptr` allows multiple owners via reference counting",
    option_b: "`std::unique_ptr` leaks memory automatically",
    option_c: "`std::shared_ptr` can only point to primitive integers",
    option_d: "There is no difference in ownership semantics",
    correct_answer: "`std::unique_ptr` manages sole ownership with zero runtime reference-counting overhead and cannot be copied (only moved); `std::shared_ptr` allows multiple owners via reference counting",
    explanation: "`std::unique_ptr` provides RAII automatic resource deletion with exclusive ownership. `std::shared_ptr` uses an atomic control block for shared ownership."
  },
  {
    category: "C++ & Low Level Systems",
    subcategory: "Virtual Functions & Vtables",
    difficulty: "Hard",
    question_text: "How do C++ compilers implement Dynamic Dispatch (runtime polymorphism) for virtual member functions?",
    option_a: "By scanning the hard drive at runtime",
    option_b: "Each class with virtual functions gets a static Virtual Method Table (vtable) of function pointers, and each object instance stores a hidden vpointer (vptr) pointing to its class vtable",
    option_c: "By converting C++ code into Python",
    option_d: "Using global switch-case statements",
    correct_answer: "Each class with virtual functions gets a static Virtual Method Table (vtable) of function pointers, and each object instance stores a hidden vpointer (vptr) pointing to its class vtable",
    explanation: "Dynamic dispatch resolves polymorphic method calls by looking up the function pointer via `this->vptr->vtable[index]()` at runtime."
  },

  // =========================================================================
  // 12. MACHINE LEARNING & DATA SCIENCE INTERVIEW ESSENTIALS
  // =========================================================================
  {
    category: "Machine Learning & AI",
    subcategory: "Model Evaluation",
    difficulty: "Medium",
    question_text: "When evaluating a classification model on an imbalanced dataset (e.g. 99% negative, 1% fraud positive), why is Accuracy a misleading metric, and what should be used instead?",
    option_a: "Accuracy is never misleading; it is the best metric",
    option_b: "A naive model predicting all negatives achieves 99% accuracy while catching 0% of fraud; Precision, Recall, F1-Score, and ROC-AUC are required",
    option_c: "Accuracy only works for regression problems",
    option_d: "Accuracy requires GPU processing",
    correct_answer: "A naive model predicting all negatives achieves 99% accuracy while catching 0% of fraud; Precision, Recall, F1-Score, and ROC-AUC are required",
    explanation: "Under severe class imbalance, accuracy paradox rewards majority-class predictions. F1-Score harmonizes Precision and Recall for true minority-class performance."
  },
  {
    category: "Machine Learning & AI",
    subcategory: "Overfitting vs Underfitting",
    difficulty: "Easy",
    question_text: "What does High Variance indicate in machine learning model training?",
    option_a: "The model is too simple and underfits the data (high training and test error)",
    option_b: "The model has learned training set noise and specific patterns too closely (Overfitting), performing exceptionally well on training data but poorly on unseen test data",
    option_c: "The dataset has zero variance",
    option_d: "The learning rate is 0",
    correct_answer: "The model has learned training set noise and specific patterns too closely (Overfitting), performing exceptionally well on training data but poorly on unseen test data",
    explanation: "High variance reflects overfitting. Regularization (L1/L2), dropout, cross-validation, and pruning help reduce variance."
  },
  {
    category: "Machine Learning & AI",
    subcategory: "Optimization",
    difficulty: "Medium",
    question_text: "What is the purpose of Gradient Descent optimization in training artificial neural networks?",
    option_a: "To randomly guess weight parameters",
    option_b: "To iteratively update model weights in the opposite direction of the gradient of the loss function to minimize prediction error",
    option_c: "To sort training datasets in ascending order",
    option_d: "To compress PNG images",
    correct_answer: "To iteratively update model weights in the opposite direction of the gradient of the loss function to minimize prediction error",
    explanation: "Gradient descent computes `w = w - lr * dLoss/dw` to descend along the steepest slope of the error surface towards a minimum."
  }
];

async function seedMassive() {
  try {
    console.log("🌱 Connecting to PostgreSQL to seed massive interview questions...");
    console.log(`📋 Total new candidate questions to process: ${massiveQuestions.length}`);

    let insertedCount = 0;
    let skippedDuplicates = 0;

    for (const q of massiveQuestions) {
      const checkRes = await pool.query(
        `SELECT id FROM questions WHERE question_text = $1 LIMIT 1;`,
        [q.question_text.trim()]
      );

      if (checkRes.rows.length === 0) {
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
        insertedCount++;
      } else {
        skippedDuplicates++;
      }
    }

    const totalCountRes = await pool.query(`SELECT COUNT(*) as total FROM questions;`);
    console.log(`✅ Success! Inserted ${insertedCount} brand new unique questions.`);
    console.log(`🛡️ Skipped duplicates: ${skippedDuplicates}`);
    console.log(`🎉 Total questions now in Question Bank: ${totalCountRes.rows[0].total}`);
    
    // Category Breakdown
    const catBreakdown = await pool.query(`
      SELECT category, count(*) as count 
      FROM questions 
      GROUP BY category 
      ORDER BY count DESC;
    `);
    console.log("\n📊 Updated Category Breakdown in Question Bank:");
    console.table(catBreakdown.rows);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
}

seedMassive();
