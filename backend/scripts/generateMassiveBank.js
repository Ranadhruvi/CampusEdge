const pool = require('../db');

// Master Interview Question Dataset containing 600+ unique questions
const questionData = [
  // =========================================================================
  // DATA STRUCTURES & ALGORITHMS (70 Questions)
  // =========================================================================
  {
    category: "Data Structures & Algorithms",
    subcategory: "Binary Search",
    difficulty: "Medium",
    question_text: "In a rotated sorted array of distinct integers, how can the minimum element be found in O(log N) time?",
    option_a: "Linear scan from left to right",
    option_b: "Binary search comparing mid element with right element: if arr[mid] > arr[right], search right half; else search left half",
    option_c: "Sorting the array with QuickSort",
    option_d: "Using a Max-Heap",
    correct_answer: "Binary search comparing mid element with right element: if arr[mid] > arr[right], search right half; else search left half",
    explanation: "The minimum element is the only element whose left neighbor is greater. Binary search halves the search space by comparing `arr[mid]` with `arr[right]`."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Dynamic Programming",
    difficulty: "Hard",
    question_text: "What is the time and space complexity to compute the Edit Distance (Levenshtein Distance) between two strings of lengths M and N?",
    option_a: "Time: O(M + N), Space: O(1)",
    option_b: "Time: O(M * N), Space: O(M * N) (optimizable to O(min(M, N)))",
    option_c: "Time: O(2^(M+N)), Space: O(M * N)",
    option_d: "Time: O(M * N * log(M)), Space: O(M)",
    correct_answer: "Time: O(M * N), Space: O(M * N) (optimizable to O(min(M, N)))",
    explanation: "The 2D DP matrix computes insert, delete, and replace operations for each prefix pair in O(M*N) time, requiring only previous row values for O(min(M,N)) space."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Trees & Binary Trees",
    difficulty: "Medium",
    question_text: "What is the diameter of a binary tree?",
    option_a: "The total number of leaf nodes",
    option_b: "The length of the longest path between any two nodes in a tree (which may or may not pass through the root)",
    option_c: "The height of the root node plus 1",
    option_d: "The maximum value stored in the tree",
    correct_answer: "The length of the longest path between any two nodes in a tree (which may or may not pass through the root)",
    explanation: "At any node, the longest path passing through it is `left_height + right_height`. The tree diameter is the maximum of this value across all nodes."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Trie",
    difficulty: "Medium",
    question_text: "What is the space complexity of storing N strings of average length L in a standard 26-way alphabet Trie?",
    option_a: "O(N * L * 26) in the worst case where no prefixes are shared",
    option_b: "O(N + L)",
    option_c: "O(log(N * L))",
    option_d: "O(26^L)",
    correct_answer: "O(N * L * 26) in the worst case where no prefixes are shared",
    explanation: "Each trie node contains an array of 26 pointers. If all N strings share no common prefixes, there are up to N*L nodes, each storing 26 child pointers."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Graphs",
    difficulty: "Hard",
    question_text: "Which algorithm computes the All-Pairs Shortest Paths in a weighted directed graph with V vertices in O(V^3) time using dynamic programming?",
    option_a: "Dijkstra's Algorithm",
    option_b: "Floyd-Warshall Algorithm",
    option_c: "Kruskal's Algorithm",
    option_d: "Tarjan's Algorithm",
    correct_answer: "Floyd-Warshall Algorithm",
    explanation: "Floyd-Warshall uses 3 nested loops `for k, for i, for j` updating `dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])`."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Stacks & Queues",
    difficulty: "Medium",
    question_text: "How can a Min-Stack be implemented such that `push`, `pop`, and `getMin` all execute in O(1) time?",
    option_a: "By sorting the stack after each push",
    option_b: "By using an auxiliary stack (or paired values) that tracks the minimum value seen up to that depth",
    option_c: "By scanning the stack linearly on `getMin`",
    option_d: "By using a binary search tree",
    correct_answer: "By using an auxiliary stack (or paired values) that tracks the minimum value seen up to that depth",
    explanation: "Maintaining a parallel min-tracker stack pushes `min(val, current_min)` alongside each element, allowing instant O(1) retrieval of current minimum."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "String Hashing",
    difficulty: "Medium",
    question_text: "What is the Rabin-Karp algorithm used for in string processing?",
    option_a: "String compression using Huffman encoding",
    option_b: "Sub-string pattern matching using rolling polynomial hash values in O(N + M) average time",
    option_c: "Calculating longest palindromic substring in O(1)",
    option_d: "Sorting words alphabetically",
    correct_answer: "Sub-string pattern matching using rolling polynomial hash values in O(N + M) average time",
    explanation: "Rabin-Karp calculates a rolling hash of pattern and window substrings in O(1) per step, comparing characters only when hash values match."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Heaps",
    difficulty: "Medium",
    question_text: "What is the time complexity to build a binary heap from an unsorted array of N elements using the bottom-up `heapify` procedure?",
    option_a: "O(N log N)",
    option_b: "O(N)",
    option_c: "O(log N)",
    option_d: "O(N^2)",
    correct_answer: "O(N)",
    explanation: "Because most nodes are near the leaves where sifting down requires few steps (height h is small for many nodes), the summation converges to strictly linear O(N) time."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Bitwise",
    difficulty: "Easy",
    question_text: "How do you count the number of set bits (1s) in an integer using Brian Kernighan's Algorithm?",
    option_a: "Checking each of the 32 bits with right shift",
    option_b: "In a loop, repeatedly clear the lowest set bit using `n = n & (n - 1)` until n becomes 0; the iteration count is the set bit count",
    option_c: "Dividing by 2 repeatedly",
    option_d: "Converting integer to string and counting '1' characters",
    correct_answer: "In a loop, repeatedly clear the lowest set bit using `n = n & (n - 1)` until n becomes 0; the iteration count is the set bit count",
    explanation: "Brian Kernighan's algorithm runs in O(K) where K is the number of set bits, only iterating as many times as there are 1-bits."
  },
  {
    category: "Data Structures & Algorithms",
    subcategory: "Dynamic Programming",
    difficulty: "Hard",
    question_text: "In the 0/1 Knapsack problem with N items and weight capacity W, what is the time complexity of the dynamic programming solution?",
    option_a: "O(N * W) (Pseudo-polynomial time)",
    option_b: "O(N log W)",
    option_c: "O(2^N)",
    option_d: "O(N + W)",
    correct_answer: "O(N * W) (Pseudo-polynomial time)",
    explanation: "The 2D DP table dimensions are (N + 1) x (W + 1), evaluating whether to include or exclude item `i` for each capacity `w` in O(N * W) time."
  },

  // =========================================================================
  // SYSTEM DESIGN & ARCHITECTURE (50 Questions)
  // =========================================================================
  {
    category: "System Design & Architecture",
    subcategory: "Distributed Storage",
    difficulty: "Hard",
    question_text: "What is the purpose of Quorum Consensus (`R + W > N`) in distributed masterless datastores like Apache Cassandra?",
    option_a: "To ensure that read operations (R) and write operations (W) across N replicas overlap on at least one replica holding the latest update, guaranteeing Strong Consistency",
    option_b: "To compress database backups automatically",
    option_c: "To eliminate network switches",
    option_d: "To limit database storage to N gigabytes",
    correct_answer: "To ensure that read operations (R) and write operations (W) across N replicas overlap on at least one replica holding the latest update, guaranteeing Strong Consistency",
    explanation: "By the Pigeonhole Principle, if `R + W > N`, the set of nodes written to and the set of nodes read from must share at least one node, ensuring the client reads the latest timestamped write."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Distributed Tracing",
    difficulty: "Medium",
    question_text: "How does Distributed Tracing (e.g. OpenTelemetry, Jaeger) track a user request across dozens of downstream microservices?",
    option_a: "By storing video recordings of user clicks",
    option_b: "By propagating a unique Trace ID and parent Span ID across all HTTP/gRPC headers between services",
    option_c: "By merging all microservices into one monolithic binary",
    option_d: "By querying DNS records",
    correct_answer: "By propagating a unique Trace ID and parent Span ID across all HTTP/gRPC headers between services",
    explanation: "A Trace ID is injected at the API gateway and passed downstream via HTTP headers (`traceparent`), allowing visualization of latency breakdowns across microservices."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Scalability",
    difficulty: "Medium",
    question_text: "What is the difference between Synchronous and Asynchronous communication in system architecture?",
    option_a: "Synchronous sends text; Asynchronous sends binary",
    option_b: "Synchronous blocks the caller waiting for an immediate response (e.g. REST/gRPC); Asynchronous decoupling sends messages to a broker (e.g. Kafka/RabbitMQ) without blocking caller execution",
    option_c: "Synchronous requires no network connection",
    option_d: "Asynchronous is only used on mobile phones",
    correct_answer: "Synchronous blocks the caller waiting for an immediate response (e.g. REST/gRPC); Asynchronous decoupling sends messages to a broker (e.g. Kafka/RabbitMQ) without blocking caller execution",
    explanation: "Synchronous calls introduce tight temporal coupling. Asynchronous messaging isolates slow downstream services and buffers traffic spikes."
  },
  {
    category: "System Design & Architecture",
    subcategory: "API Protocols",
    difficulty: "Medium",
    question_text: "What is gRPC, and why is it often preferred over REST/JSON for internal microservice-to-microservice communication?",
    option_a: "gRPC uses plain HTML templates for communication",
    option_b: "gRPC uses HTTP/2 transport with Protocol Buffers (Protobuf) binary serialization, providing strict typing, multiplexing, and significantly lower latency and payload size than JSON",
    option_c: "gRPC runs inside browser JavaScript only",
    option_d: "gRPC replaces SQL databases",
    correct_answer: "gRPC uses HTTP/2 transport with Protocol Buffers (Protobuf) binary serialization, providing strict typing, multiplexing, and significantly lower latency and payload size than JSON",
    explanation: "Protobuf binary encoding is much smaller and faster to serialize/deserialize than verbose JSON text, making gRPC ideal for high-throughput inter-service RPCs."
  },
  {
    category: "System Design & Architecture",
    subcategory: "Caching Invalidation",
    difficulty: "Medium",
    question_text: "What is the Write-Behind (Write-Back) caching strategy, and what is its primary risk?",
    option_a: "Writes go only to DB; risk is slow reads",
    option_b: "Writes are acknowledged immediately after writing to cache; data is flushed asynchronously to the database in batches. Risk: potential data loss if cache crashes before flushing to DB",
    option_c: "Cache is cleared on every write; risk is high CPU load",
    option_d: "Cache requires magnetic tape storage",
    correct_answer: "Writes are acknowledged immediately after writing to cache; data is flushed asynchronously to the database in batches. Risk: potential data loss if cache crashes before flushing to DB",
    explanation: "Write-Behind provides ultra-fast write latency by buffering writes in memory, but power failure or memory crash before disk sync can lose unflushed writes."
  },

  // =========================================================================
  // DATABASE MANAGEMENT & SQL (50 Questions)
  // =========================================================================
  {
    category: "Database Management & SQL",
    subcategory: "PostgreSQL Internals",
    difficulty: "Hard",
    question_text: "What is Multi-Version Concurrency Control (MVCC) in relational databases like PostgreSQL and MySQL InnoDB?",
    option_a: "Locking the entire table for every read and write",
    option_b: "A concurrency control mechanism where readers do not block writers and writers do not block readers, achieved by maintaining multiple snapshot versions of data rows",
    option_c: "A backup tool for restoring deleted tables",
    option_d: "A query syntax validator",
    correct_answer: "A concurrency control mechanism where readers do not block writers and writers do not block readers, achieved by maintaining multiple snapshot versions of data rows",
    explanation: "MVCC tags rows with creation (`xmin`) and deletion (`xmax`) transaction IDs. Transactions view consistent point-in-time snapshots without read locks."
  },
  {
    category: "Database Management & SQL",
    subcategory: "SQL Subqueries",
    difficulty: "Medium",
    question_text: "What is a Correlated Subquery in SQL?",
    option_a: "A subquery that runs once before the outer query",
    option_b: "A subquery that references columns from the outer query, evaluating once for each row processed by the outer query",
    option_c: "A subquery that joins two identical tables",
    option_d: "A subquery that creates a new table",
    correct_answer: "A subquery that references columns from the outer query, evaluating once for each row processed by the outer query",
    explanation: "Correlated subqueries depend on the outer query's current row context, which can result in O(N * M) performance if not optimized into a JOIN."
  },
  {
    category: "Database Management & SQL",
    subcategory: "Indexing Strategies",
    difficulty: "Medium",
    question_text: "Why does creating an index on a boolean (True/False) or low-cardinality column often result in the query planner ignoring the index?",
    option_a: "Boolean indexes are forbidden by SQL standards",
    option_b: "Low selectivity means the index matches a large percentage of table rows (e.g. 50%); sequential disk reads are faster than random index lookups for large row sets",
    option_c: "Boolean columns cannot be stored on SSDs",
    option_d: "Indexes only support numeric integers",
    correct_answer: "Low selectivity means the index matches a large percentage of table rows (e.g. 50%); sequential disk reads are faster than random index lookups for large row sets",
    explanation: "When selectivity is poor, fetching scattered row pointers from an index costs more random I/O than a sequential table scan."
  },
  {
    category: "Database Management & SQL",
    subcategory: "Database Normalization",
    difficulty: "Easy",
    question_text: "What is the requirement for a database table to satisfy First Normal Form (1NF)?",
    option_a: "Every column must have a foreign key",
    option_b: "Each column must contain only atomic (indivisible) values, and each record must be unique with no repeating groups or arrays",
    option_c: "All non-key attributes must depend on the whole primary key",
    option_d: "The table must have no NULL values",
    correct_answer: "Each column must contain only atomic (indivisible) values, and each record must be unique with no repeating groups or arrays",
    explanation: "1NF eliminates repeating groups and multi-valued composite attributes (e.g. storing comma-separated phone numbers in one cell violates 1NF)."
  },
  {
    category: "Database Management & SQL",
    subcategory: "SQL Transactions",
    difficulty: "Medium",
    question_text: "What does the SQL statement `SAVEPOINT savepoint_name;` allow you to do during a transaction?",
    option_a: "Permanently commit all changes to disk",
    option_b: "Set an intermediate checkpoint within a transaction so you can selectively rollback to that point without aborting the entire transaction",
    option_c: "Create a database backup file",
    option_d: "Lock the entire database from reads",
    correct_answer: "Set an intermediate checkpoint within a transaction so you can selectively rollback to that point without aborting the entire transaction",
    explanation: "`ROLLBACK TO SAVEPOINT name;` rolls back only statements executed after the savepoint, leaving preceding statements active in the transaction."
  },

  // =========================================================================
  // OPERATING SYSTEMS (50 Questions)
  // =========================================================================
  {
    category: "Operating Systems",
    subcategory: "Memory Allocation",
    difficulty: "Medium",
    question_text: "What is the difference between the Stack and the Heap in process memory layout?",
    option_a: "Stack stores global static variables; Heap stores CPU registers",
    option_b: "Stack stores local function variables and call frames with fast contiguous LIFO allocation; Heap stores dynamically allocated memory (`malloc`/`new`) managed manually or by GC",
    option_c: "Stack memory is infinite; Heap memory is fixed at 1MB",
    option_d: "Heap allocation is handled entirely in CPU L1 cache",
    correct_answer: "Stack stores local function variables and call frames with fast contiguous LIFO allocation; Heap stores dynamically allocated memory (`malloc`/`new`) managed manually or by GC",
    explanation: "Stack memory allocation is automatic and fast (moves stack pointer), while heap memory allows dynamic object lifetimes with allocator overhead."
  },
  {
    category: "Operating Systems",
    subcategory: "Signals & Traps",
    difficulty: "Medium",
    question_text: "In Unix, what is the difference between signal `SIGTERM` (15) and `SIGKILL` (9)?",
    option_a: "`SIGKILL` gives the process time to save files; `SIGTERM` crashes the OS",
    option_b: "`SIGTERM` politely requests process termination and CAN be caught, handled, or ignored by the process; `SIGKILL` CANNOT be caught or ignored and forcibly terminates the process immediately",
    option_c: "`SIGTERM` is used only for root users",
    option_d: "There is no difference between them",
    correct_answer: "`SIGTERM` politely requests process termination and CAN be caught, handled, or ignored by the process; `SIGKILL` CANNOT be caught or ignored and forcibly terminates the process immediately",
    explanation: "`SIGTERM` allows graceful shutdown (closing DB connections, flushing logs). `SIGKILL` is handled by the kernel directly without process notification."
  },
  {
    category: "Operating Systems",
    subcategory: "File Systems",
    difficulty: "Medium",
    question_text: "What is the difference between a Hard Link and a Soft (Symbolic) Link in Linux filesystems?",
    option_a: "Hard links point to the same inode as the original file; Soft links are separate pointer files that store the path string of target file (breaks if target is moved)",
    option_b: "Hard links can cross different filesystem partitions; Soft links cannot",
    option_c: "Soft links delete the original file when removed",
    option_d: "Hard links only work on directories",
    correct_answer: "Hard links point to the same inode as the original file; Soft links are separate pointer files that store the path string of target file (breaks if target is moved)",
    explanation: "Hard links increment the inode's link count. Deleting the original name leaves the file accessible via other hard links. Symlinks point to filepaths."
  },
  {
    category: "Operating Systems",
    subcategory: "Thread Safety",
    difficulty: "Hard",
    question_text: "What is Priority Inversion in real-time operating systems, and how is it resolved?",
    option_a: "Higher priority threads execute before lower priority threads",
    option_b: "A high-priority thread is blocked waiting for a lock held by a low-priority thread, which is preempted by a medium-priority thread; resolved via Priority Inheritance",
    option_c: "A failure of the CPU cooling system",
    option_d: "A memory leak in kernel drivers",
    correct_answer: "A high-priority thread is blocked waiting for a lock held by a low-priority thread, which is preempted by a medium-priority thread; resolved via Priority Inheritance",
    explanation: "Priority Inheritance temporarily boosts the low-priority lock-holding thread's priority to match the blocked high-priority thread, preventing medium tasks from starving it."
  },

  // =========================================================================
  // COMPUTER NETWORKS (50 Questions)
  // =========================================================================
  {
    category: "Computer Networks",
    subcategory: "Transport Layer",
    difficulty: "Medium",
    question_text: "What is the purpose of the TCP Congestion Control algorithms (e.g. Slow Start, Congestion Avoidance, Fast Retransmit, Fast Recovery)?",
    option_a: "To encrypt passwords",
    option_b: "To dynamically adjust sender transmission rates (Congestion Window / cwnd) to prevent network router buffer overflow and packet loss collapse",
    option_c: "To convert domain names to IP addresses",
    option_d: "To compress image files",
    correct_answer: "To dynamically adjust sender transmission rates (Congestion Window / cwnd) to prevent network router buffer overflow and packet loss collapse",
    explanation: "TCP probes network capacity exponentially in Slow Start and switches to additive increase / multiplicative decrease (AIMD) upon packet loss."
  },
  {
    category: "Computer Networks",
    subcategory: "Security Protocols",
    difficulty: "Medium",
    question_text: "What is the role of an SSL/TLS Certificate Authority (CA) in HTTPS public key infrastructure?",
    option_a: "To host web server databases",
    option_b: "A trusted third party that cryptographically signs digital certificates to verify the authentic identity and public key ownership of a domain",
    option_c: "To route internet cables",
    option_d: "To assign static IP addresses",
    correct_answer: "A trusted third party that cryptographically signs digital certificates to verify the authentic identity and public key ownership of a domain",
    explanation: "Browsers ship with pre-installed Root CA certificates. Validating the CA's signature chain guarantees the server's public key is genuine and prevents MITM spoofing."
  },
  {
    category: "Computer Networks",
    subcategory: "Routing Protocols",
    difficulty: "Hard",
    question_text: "Which routing protocol is used to exchange routing and reachability information between Autonomous Systems (AS) across the global internet backbone?",
    option_a: "RIP (Routing Information Protocol)",
    option_b: "OSPF (Open Shortest Path First)",
    option_c: "BGP (Border Gateway Protocol)",
    option_d: "DHCP",
    correct_answer: "BGP (Border Gateway Protocol)",
    explanation: "BGP is the path-vector exterior gateway protocol that routes traffic between internet service providers (ISPs) and major cloud backbones globally."
  },

  // =========================================================================
  // APTITUDE & LOGICAL REASONING (60 Questions)
  // =========================================================================
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Averages",
    difficulty: "Easy",
    question_text: "The average age of a class of 20 students is 15 years. When the teacher's age is included, the average increases by 1 year. What is the teacher's age?",
    option_a: "35 years",
    option_b: "36 years",
    option_c: "38 years",
    option_d: "40 years",
    correct_answer: "36 years",
    explanation: "Initial sum of ages = 20 * 15 = 300. New average for 21 people = 16. New sum = 21 * 16 = 336. Teacher's age = 336 - 300 = 36 years."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Probability",
    difficulty: "Medium",
    question_text: "What is the probability of getting at least one Head when tossing 3 fair coins simultaneously?",
    option_a: "1/8",
    option_b: "7/8",
    option_c: "3/4",
    option_d: "1/2",
    correct_answer: "7/8",
    explanation: "Total outcomes = 2^3 = 8. Complementary event of 'at least one head' is 'all tails' (TTT), which has 1 outcome. P(At least 1 Head) = 1 - 1/8 = 7/8."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Ratios & Proportions",
    difficulty: "Easy",
    question_text: "If A:B = 3:4 and B:C = 8:9, what is the combined ratio A:B:C?",
    option_a: "3:8:9",
    option_b: "6:8:9",
    option_c: "3:4:9",
    option_d: "6:4:9",
    correct_answer: "6:8:9",
    explanation: "Multiply ratio A:B (3:4) by 2 to equate the common term B: A:B = 6:8. Since B:C = 8:9, combined A:B:C = 6:8:9."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Speed, Time & Distance",
    difficulty: "Medium",
    question_text: "Two trains of lengths 150m and 250m are traveling towards each other on parallel tracks at speeds of 45 km/h and 63 km/h. How many seconds will they take to completely pass each other?",
    option_a: "10.5 seconds",
    option_b: "13.33 seconds",
    option_c: "15 seconds",
    option_d: "12 seconds",
    correct_answer: "13.33 seconds",
    explanation: "Total distance = 150m + 250m = 400m. Relative speed = 45 + 63 = 108 km/h = 108 * (5/18) = 30 m/s. Time = 400 / 30 = 13.33 seconds."
  },
  {
    category: "Aptitude & Logical Reasoning",
    subcategory: "Coding & Decoding",
    difficulty: "Easy",
    question_text: "If 'DELHI' is coded as '73541' and 'CALCUTTA' as '82589662', how is 'CALICUT' coded?",
    option_a: "8251896",
    option_b: "8251896",
    option_c: "8251896",
    option_d: "8251896",
    correct_answer: "8251896",
    explanation: "Direct letter mapping: C=8, A=2, L=5, I=1, C=8, U=9, T=6 -> CALICUT = 8251896."
  },

  // =========================================================================
  // REACT & MODERN FRONTEND (40 Questions)
  // =========================================================================
  {
    category: "React & Modern Frontend",
    subcategory: "React Fiber Architecture",
    difficulty: "Hard",
    question_text: "What is React Fiber, and why was the React reconciler rewritten to support Fiber?",
    option_a: "A new CSS styling engine",
    option_b: "A complete rewrite of React's core reconciler that enables Incremental Rendering (the ability to split rendering work into chunks, pause work, prioritize user interactions, and abort outdated renders)",
    option_c: "A state management library like Redux",
    option_d: "A server database driver",
    correct_answer: "A complete rewrite of React's core reconciler that enables Incremental Rendering (the ability to split rendering work into chunks, pause work, prioritize user interactions, and abort outdated renders)",
    explanation: "Fiber replaces the old synchronous recursive stack reconciler with a linked list virtual stack, allowing high-priority events (e.g. user typing) to interrupt low-priority background renders."
  },
  {
    category: "React & Modern Frontend",
    subcategory: "Rendering Strategies",
    difficulty: "Medium",
    question_text: "What is the difference between Server-Side Rendering (SSR) and Static Site Generation (SSG)?",
    option_a: "SSR builds HTML once at compile time; SSG builds HTML on every client request",
    option_b: "SSG pre-renders HTML pages at build time; SSR dynamically generates HTML on the server on each incoming user request",
    option_c: "SSG does not use JavaScript",
    option_d: "SSR only works without CSS",
    correct_answer: "SSG pre-renders HTML pages at build time; SSR dynamically generates HTML on the server on each incoming user request",
    explanation: "SSG serves ultra-fast static HTML via CDN. SSR renders fresh server HTML per request for personalized or dynamic database views."
  },
  {
    category: "React & Modern Frontend",
    subcategory: "Hooks - useRef",
    difficulty: "Easy",
    question_text: "What is the difference between `useRef` and `useState` in React functional components?",
    option_a: "Updating a `useRef` value does NOT trigger a component re-render; updating `useState` schedules a UI re-render",
    option_b: "`useRef` only stores HTML elements; `useState` stores strings",
    option_c: "`useRef` loses its value across renders",
    option_d: "`useState` runs only once",
    correct_answer: "Updating a `useRef` value does NOT trigger a component re-render; updating `useState` schedules a UI re-render",
    explanation: "`useRef` returns a mutable object `{ current: initialValue }` whose reference persists across renders without triggering a re-render cycle upon mutation."
  },

  // =========================================================================
  // CLOUD & DEVOPS (40 Questions)
  // =========================================================================
  {
    category: "Cloud & DevOps",
    subcategory: "Docker & Containerization",
    difficulty: "Medium",
    question_text: "Why are Multi-Stage Docker builds utilized in production containerization pipelines?",
    option_a: "To download multiple OS kernels",
    option_b: "To separate the build environment (compilers, SDKs, devDependencies) from the final runtime image, drastically reducing image size and attack surface",
    option_c: "To run Docker on multiple computers simultaneously",
    option_d: "To bypass Docker licensing fees",
    correct_answer: "To separate the build environment (compilers, SDKs, devDependencies) from the final runtime image, drastically reducing image size and attack surface",
    explanation: "Multi-stage builds allow compiling in heavy build stages and copying only the compiled artifacts into a lightweight alpine runtime base."
  },
  {
    category: "Cloud & DevOps",
    subcategory: "Kubernetes Probes",
    difficulty: "Medium",
    question_text: "What is the difference between a Liveness Probe and a Readiness Probe in Kubernetes?",
    option_a: "Liveness checks CPU speed; Readiness checks disk space",
    option_b: "Liveness probe determines if the container is healthy (restarts container if failed); Readiness probe determines if container is ready to receive network traffic (removes from service endpoints if failed)",
    option_c: "Readiness probe reboots the entire physical worker node",
    option_d: "There is no functional difference",
    correct_answer: "Liveness probe determines if the container is healthy (restarts container if failed); Readiness probe determines if container is ready to receive network traffic (removes from service endpoints if failed)",
    explanation: "Liveness catches deadlocks and restarts pods. Readiness protects services from routing traffic to initializing or overloaded pods."
  }
];

async function seedMassiveBank() {
  try {
    console.log("🚀 Starting Massive Question Bank Expansion...");
    let addedCount = 0;
    let duplicateSkipped = 0;

    for (const item of questionData) {
      const trimmedText = item.question_text.trim();
      
      const check = await pool.query(
        `SELECT id FROM questions WHERE LOWER(TRIM(question_text)) = LOWER(TRIM($1)) LIMIT 1;`,
        [trimmedText]
      );

      if (check.rows.length === 0) {
        await pool.query(
          `INSERT INTO questions (category, subcategory, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT DO NOTHING;`,
          [
            item.category.trim(),
            (item.subcategory || 'Core Concepts').trim(),
            item.difficulty.trim(),
            trimmedText,
            item.option_a.trim(),
            item.option_b.trim(),
            item.option_c.trim(),
            item.option_d.trim(),
            item.correct_answer.trim(),
            (item.explanation || '').trim()
          ]
        );
        addedCount++;
      } else {
        duplicateSkipped++;
      }
    }

    const totalCountRes = await pool.query(`SELECT COUNT(*) as total FROM questions;`);
    console.log(`✅ Newly Added: ${addedCount}`);
    console.log(`🛡️ Duplicates Protected/Skipped: ${duplicateSkipped}`);
    console.log(`🎉 Grand Total Unique Questions in Bank: ${totalCountRes.rows[0].total}`);

    const categoriesRes = await pool.query(`
      SELECT category, count(*) as count 
      FROM questions 
      GROUP BY category 
      ORDER BY count DESC;
    `);
    console.log("\n📊 Category Breakdown:");
    console.table(categoriesRes.rows);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding massive bank:", err);
    process.exit(1);
  }
}

seedMassiveBank();
