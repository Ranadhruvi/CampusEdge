const pool = require('../db');

async function cleanAndSeedQuestions() {
  try {
    console.log("🧹 1. Cleaning up placeholder/templated questions with '#'...");
    
    // Purge any question containing '#' in question_text or options
    const deleteRes = await pool.query(`
      DELETE FROM questions 
      WHERE question_text LIKE '%#%' 
         OR option_a LIKE '%#%' 
         OR option_b LIKE '%#%' 
         OR option_c LIKE '%#%' 
         OR option_d LIKE '%#%'
         OR question_text LIKE '%Concept #%'
         OR question_text LIKE '%primitive #%'
         OR question_text LIKE '%domain #%'
    `);
    console.log(`✅ Deleted ${deleteRes.rowCount} placeholder/templated questions.`);

    console.log("🌱 2. Inserting authentic, high-quality technical placement questions across all 17 categories...");

    const questionsBank = [
      // =========================================================================
      // 1. OPERATING SYSTEMS
      // =========================================================================
      {
        category: "Operating Systems",
        subcategory: "Process & Concurrency",
        difficulty: "Medium",
        question_text: "Which condition is NOT one of Coffman's four necessary conditions for a deadlock to occur?",
        option_a: "Mutual Exclusion",
        option_b: "Hold and Wait",
        option_c: "Preemption Allowed",
        option_d: "Circular Wait",
        correct_answer: "Preemption Allowed",
        explanation: "Coffman's 4 conditions are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. If preemption is allowed, deadlocks cannot occur."
      },
      {
        category: "Operating Systems",
        subcategory: "Memory Management",
        difficulty: "Medium",
        question_text: "What is Belady's Anomaly in operating system page replacement algorithms?",
        option_a: "Increasing the number of page frames results in an increase in the number of page faults",
        option_b: "Decreasing physical RAM speeds up process execution",
        option_c: "LRU page replacement causes thrashing",
        option_d: "Virtual memory allocation causes fragmentation",
        correct_answer: "Increasing the number of page frames results in an increase in the number of page faults",
        explanation: "Belady's Anomaly commonly occurs in FIFO (First-In, First-Out) page replacement where giving more physical frames unexpectedly causes more page faults."
      },
      {
        category: "Operating Systems",
        subcategory: "CPU Scheduling",
        difficulty: "Easy",
        question_text: "Which CPU scheduling algorithm is non-preemptive by default and may suffer from the Convoy Effect?",
        option_a: "First-Come, First-Served (FCFS)",
        option_b: "Round Robin (RR)",
        option_c: "Shortest Remaining Time First (SRTF)",
        option_d: "Multilevel Feedback Queue",
        correct_answer: "First-Come, First-Served (FCFS)",
        explanation: "In FCFS, if a long CPU-bound process arrives first, all subsequent short I/O-bound processes get blocked behind it, known as the Convoy Effect."
      },
      {
        category: "Operating Systems",
        subcategory: "Virtual Memory",
        difficulty: "Medium",
        question_text: "What is the primary function of the Translation Lookaside Buffer (TLB)?",
        option_a: "A hardware cache on the CPU used to speed up virtual-to-physical address translation",
        option_b: "A disk buffer for storing swap files",
        option_c: "A software queue for CPU interrupt handling",
        option_d: "A temporary storage for terminated processes",
        correct_answer: "A hardware cache on the CPU used to speed up virtual-to-physical address translation",
        explanation: "The TLB caches recent virtual page number to physical frame number mappings, allowing single-cycle address translation without accessing main memory page tables."
      },
      {
        category: "Operating Systems",
        subcategory: "Process Synchronization",
        difficulty: "Hard",
        question_text: "What is the difference between a Mutex and a Counting Semaphore?",
        option_a: "A Mutex is a binary lock with ownership (only the locking thread can unlock); a Semaphore is a signaling mechanism that manages a pool of resources",
        option_b: "A Mutex can only be used on single-core CPUs",
        option_c: "A Semaphore does not allow concurrent access",
        option_d: "There is no difference between them",
        correct_answer: "A Mutex is a binary lock with ownership (only the locking thread can unlock); a Semaphore is a signaling mechanism that manages a pool of resources",
        explanation: "Mutex provides strict mutual exclusion with ownership semantics. A counting semaphore maintains an integer counter allowing up to N concurrent threads."
      },
      {
        category: "Operating Systems",
        subcategory: "File Systems",
        difficulty: "Medium",
        question_text: "In Unix/Linux file systems, what information is stored inside an inode?",
        option_a: "File size, permissions, owner, timestamps, and disk block pointers (but NOT the filename)",
        option_b: "Only the file name and directory path",
        option_c: "The full binary content of the file",
        option_d: "User passwords and login history",
        correct_answer: "File size, permissions, owner, timestamps, and disk block pointers (but NOT the filename)",
        explanation: "An inode stores all file metadata and data block pointers. The filename is stored in the directory entry mapping to the inode number."
      },
      {
        category: "Operating Systems",
        subcategory: "Virtual Memory",
        difficulty: "Medium",
        question_text: "What causes 'Thrashing' in an operating system?",
        option_a: "When the system spends more time swapping pages in and out of virtual memory than executing actual instructions",
        option_b: "When the hard disk runs out of storage space",
        option_c: "When multiple processes write to the same file simultaneously",
        option_d: "When the CPU fan fails and causes overheating",
        correct_answer: "When the system spends more time swapping pages in and out of virtual memory than executing actual instructions",
        explanation: "Thrashing occurs when the sum of working sets of all active processes exceeds available physical RAM, causing continuous page faulting."
      },
      {
        category: "Operating Systems",
        subcategory: "Process & Threads",
        difficulty: "Easy",
        question_text: "What is a 'Zombie Process' in Unix-like operating systems?",
        option_a: "A process that has finished execution but still has an entry in the process table because its parent has not yet read its exit status",
        option_b: "A process that cannot be terminated by the kill command",
        option_c: "A process running in an infinite loop consuming 100% CPU",
        option_d: "A virus infected background daemon",
        correct_answer: "A process that has finished execution but still has an entry in the process table because its parent has not yet read its exit status",
        explanation: "A zombie process has terminated its execution, but its PCB remains in the process table until the parent process calls `wait()` or `waitpid()`."
      },
      {
        category: "Operating Systems",
        subcategory: "System Calls",
        difficulty: "Medium",
        question_text: "What does the `fork()` system call return to the parent process and to the child process upon successful execution?",
        option_a: "Returns the child PID to the parent process, and 0 to the child process",
        option_b: "Returns 0 to the parent, and child PID to the child",
        option_c: "Returns 1 to both processes",
        option_d: "Returns the parent PID to both processes",
        correct_answer: "Returns the child PID to the parent process, and 0 to the child process",
        explanation: "Upon successful creation of a child process, fork() returns the newly created child's PID to the parent and returns 0 to the child process."
      },
      {
        category: "Operating Systems",
        subcategory: "Memory Management",
        difficulty: "Hard",
        question_text: "What is the difference between Internal Fragmentation and External Fragmentation?",
        option_a: "Internal occurs when allocated memory block is larger than requested data; External occurs when total free memory is enough but divided into non-contiguous scattered holes",
        option_b: "Internal fragmentation only happens on hard drives",
        option_c: "External fragmentation happens inside fixed-size pages",
        option_d: "There is no difference between them",
        correct_answer: "Internal occurs when allocated memory block is larger than requested data; External occurs when total free memory is enough but divided into non-contiguous scattered holes",
        explanation: "Fixed-size allocation (like paging) suffers from internal fragmentation in the last page, while variable-size allocation (segmentation) causes external fragmentation."
      },

      // =========================================================================
      // 2. COMPUTER NETWORKS
      // =========================================================================
      {
        category: "Computer Networks",
        subcategory: "Transport Layer",
        difficulty: "Medium",
        question_text: "What are the flags exchanged during a standard TCP 3-Way Handshake connection establishment?",
        option_a: "SYN -> SYN-ACK -> ACK",
        option_b: "ACK -> SYN -> SYN-ACK",
        option_c: "FIN -> ACK -> FIN-ACK",
        option_d: "RST -> SYN -> ACK",
        correct_answer: "SYN -> SYN-ACK -> ACK",
        explanation: "Client sends SYN (synchronize sequence numbers), server responds with SYN-ACK (acknowledge and send server sequence number), client replies with ACK."
      },
      {
        category: "Computer Networks",
        subcategory: "OSI Model",
        difficulty: "Easy",
        question_text: "At which layer of the OSI model does a standard Router operate?",
        option_a: "Network Layer (Layer 3)",
        option_b: "Data Link Layer (Layer 2)",
        option_c: "Transport Layer (Layer 4)",
        option_d: "Physical Layer (Layer 1)",
        correct_answer: "Network Layer (Layer 3)",
        explanation: "Routers forward packets based on logical IP addresses, operating primarily at Layer 3 (Network Layer) of the OSI model."
      },
      {
        category: "Computer Networks",
        subcategory: "Application Layer",
        difficulty: "Medium",
        question_text: "What major transport protocol difference distinguishes HTTP/3 from HTTP/2 and HTTP/1.1?",
        option_a: "HTTP/3 runs over QUIC (built on UDP) to eliminate Head-of-Line blocking; HTTP/2 and 1.1 run over TCP",
        option_b: "HTTP/3 does not support TLS encryption",
        option_c: "HTTP/3 runs only over Bluetooth",
        option_d: "HTTP/3 requires IPv6 exclusively",
        correct_answer: "HTTP/3 runs over QUIC (built on UDP) to eliminate Head-of-Line blocking; HTTP/2 and 1.1 run over TCP",
        explanation: "HTTP/3 replaces TCP with QUIC over UDP, providing independent multiplexed streams without TCP-level head-of-line packet loss delays."
      },
      {
        category: "Computer Networks",
        subcategory: "Network Layer & IP",
        difficulty: "Medium",
        question_text: "What is the primary purpose of the Address Resolution Protocol (ARP)?",
        option_a: "Resolving a known IP address to its corresponding physical MAC address on a local network segment",
        option_b: "Converting domain names to IP addresses",
        option_c: "Encrypting wireless data packets",
        option_d: "Assigning dynamic IP addresses to new clients",
        correct_answer: "Resolving a known IP address to its corresponding physical MAC address on a local network segment",
        explanation: "ARP broadcasts a query asking 'Who has IP X.X.X.X? Tell MAC Y.Y.Y.Y' so the host can construct Layer 2 Ethernet frames."
      },
      {
        category: "Computer Networks",
        subcategory: "Transport Layer",
        difficulty: "Hard",
        question_text: "What is the purpose of the TIME_WAIT state in the TCP connection teardown process?",
        option_a: "To ensure the remote host received the final ACK and to allow lingering duplicate packets to expire in the network before reusing the port",
        option_b: "To wait for user authentication credentials",
        option_c: "To calculate total connection latency",
        option_d: "To compress log files before disconnecting",
        correct_answer: "To ensure the remote host received the final ACK and to allow lingering duplicate packets to expire in the network before reusing the port",
        explanation: "TIME_WAIT lasts 2 * MSL (Maximum Segment Lifetime), preventing delayed duplicate packets from a closed connection from interfering with a newly opened socket on the same port."
      },
      {
        category: "Computer Networks",
        subcategory: "Security & TLS",
        difficulty: "Medium",
        question_text: "In asymmetric cryptography (such as RSA or ECC), which key is used to encrypt data so that ONLY the intended recipient can read it?",
        option_a: "Recipient's Public Key",
        option_b: "Sender's Private Key",
        option_c: "Sender's Public Key",
        option_d: "A shared pre-shared password",
        correct_answer: "Recipient's Public Key",
        explanation: "Data encrypted with the recipient's public key can only be decrypted by the recipient's matching private key, ensuring confidentiality."
      },

      // =========================================================================
      // 3. DATABASE MANAGEMENT & SQL
      // =========================================================================
      {
        category: "Database Management & SQL",
        subcategory: "Transactions & ACID",
        difficulty: "Medium",
        question_text: "What does the 'I' in ACID properties stand for, and what does it prevent?",
        option_a: "Isolation: Ensures concurrent transactions do not interfere with each other and see uncommitted changes",
        option_b: "Integrity: Ensures table columns are not deleted",
        option_c: "Indexing: Ensures queries run in O(1) time",
        option_d: "Inheritance: Enables table subclassing",
        correct_answer: "Isolation: Ensures concurrent transactions do not interfere with each other and see uncommitted changes",
        explanation: "Isolation guarantees that the intermediate state of a transaction is invisible to other concurrent transactions, preventing dirty reads and non-repeatable reads."
      },
      {
        category: "Database Management & SQL",
        subcategory: "Indexing & Storage",
        difficulty: "Hard",
        question_text: "Why do relational database storage engines (like InnoDB, PostgreSQL) use B+ Trees instead of standard Binary Search Trees for disk indexing?",
        option_a: "B+ Trees have high fan-out (shallow height) minimizing disk I/O seek operations, and leaf nodes are linked for fast sequential range scans",
        option_b: "Binary search trees cannot store string values",
        option_c: "B+ Trees consume less RAM than hash tables",
        option_d: "Binary search trees do not support unique constraints",
        correct_answer: "B+ Trees have high fan-out (shallow height) minimizing disk I/O seek operations, and leaf nodes are linked for fast sequential range scans",
        explanation: "Because disk I/O is the primary bottleneck, high branching factor B+ trees keep tree depth to 3-4 levels for millions of rows, and leaf doubly-linked lists enable fast range queries."
      },
      {
        category: "Database Management & SQL",
        subcategory: "Normalization",
        difficulty: "Medium",
        question_text: "A database table is in Third Normal Form (3NF) if it is in 2NF and:",
        option_a: "Has no transitive functional dependencies for non-prime attributes",
        option_b: "Has no partial dependencies on composite keys",
        option_c: "Has all atomic values in columns",
        option_d: "Has no foreign key relationships",
        correct_answer: "Has no transitive functional dependencies for non-prime attributes",
        explanation: "1NF requires atomic values; 2NF eliminates partial key dependencies; 3NF eliminates transitive dependencies (non-key attribute determining another non-key attribute)."
      },
      {
        category: "Database Management & SQL",
        subcategory: "SQL Queries",
        difficulty: "Easy",
        question_text: "What is the difference between `WHERE` and `HAVING` clauses in SQL?",
        option_a: "`WHERE` filters individual rows before grouping; `HAVING` filters aggregated groups after `GROUP BY`",
        option_b: "`HAVING` can only be used with primary keys",
        option_c: "`WHERE` only works with numeric columns",
        option_d: "There is no difference between them",
        correct_answer: "`WHERE` filters individual rows before grouping; `HAVING` filters aggregated groups after `GROUP BY`",
        explanation: "`WHERE` filters records before aggregation. `HAVING` filters the results of aggregate functions like `COUNT()`, `SUM()`, `AVG()` after grouping."
      },
      {
        category: "Database Management & SQL",
        subcategory: "Indexing",
        difficulty: "Medium",
        question_text: "What is a Clustered Index versus a Non-Clustered Index?",
        option_a: "A Clustered Index dictates the physical storage order of rows in the table (only 1 per table); a Non-Clustered Index contains pointers to actual rows",
        option_b: "A table can have up to 250 clustered indexes",
        option_c: "Non-clustered indexes are stored in RAM only",
        option_d: "Clustered indexes only work on foreign keys",
        correct_answer: "A Clustered Index dictates the physical storage order of rows in the table (only 1 per table); a Non-Clustered Index contains pointers to actual rows",
        explanation: "Since physical rows can only be ordered one way on disk, a table can only have one clustered index (typically on the Primary Key)."
      },

      // =========================================================================
      // 4. DATA STRUCTURES & ALGORITHMS
      // =========================================================================
      {
        category: "Data Structures & Algorithms",
        subcategory: "Sorting & Searching",
        difficulty: "Medium",
        question_text: "What is the worst-case time complexity of QuickSort, and when does it occur?",
        option_a: "O(N^2), when the chosen pivot is consistently the minimum or maximum element in an already sorted array",
        option_b: "O(N log N), when the array is randomly shuffled",
        option_c: "O(N), when all elements are equal",
        option_d: "O(log N), when using three-way partitioning",
        correct_answer: "O(N^2), when the chosen pivot is consistently the minimum or maximum element in an already sorted array",
        explanation: "When partition splits the array into sizes 0 and N-1 repeatedly, the recurrence T(N) = T(N-1) + O(N) resolves to O(N^2). Randomized pivot selection avoids this."
      },
      {
        category: "Data Structures & Algorithms",
        subcategory: "Graphs",
        difficulty: "Medium",
        question_text: "Which algorithm finds the Shortest Path from a single source node in a graph with non-negative edge weights in O((V + E) log V) time?",
        option_a: "Dijkstra's Algorithm with Min-Heap Priority Queue",
        option_b: "Bellman-Ford Algorithm",
        option_c: "Floyd-Warshall Algorithm",
        option_d: "Kruskal's Algorithm",
        correct_answer: "Dijkstra's Algorithm with Min-Heap Priority Queue",
        explanation: "Dijkstra's algorithm greedily explores the minimum distance unvisited vertex using a min-heap, achieving O((V + E) log V) on adjacency lists."
      },
      {
        category: "Data Structures & Algorithms",
        subcategory: "Trees",
        difficulty: "Hard",
        question_text: "In an AVL Tree, what is the maximum allowed difference between the heights of the left and right subtrees of any node?",
        option_a: "1",
        option_b: "0",
        option_c: "2",
        option_d: "log(N)",
        correct_answer: "1",
        explanation: "The balance factor of every node in an AVL tree must be in the set {-1, 0, +1}. If balance factor reaches +2 or -2, tree rotations restore balance."
      },
      {
        category: "Data Structures & Algorithms",
        subcategory: "Dynamic Programming",
        difficulty: "Medium",
        question_text: "What is the time and space complexity of the standard 0/1 Knapsack Problem for N items and capacity W?",
        option_a: "Time: O(N * W), Space: O(N * W) or O(W) with 1D array optimization",
        option_b: "Time: O(2^N), Space: O(1)",
        option_c: "Time: O(N log N), Space: O(N)",
        option_d: "Time: O(N + W), Space: O(1)",
        correct_answer: "Time: O(N * W), Space: O(N * W) or O(W) with 1D array optimization",
        explanation: "The pseudo-polynomial DP approach builds a 2D table dp[i][w] taking O(N * W) time, which can be space-optimized to O(W) by iterating right-to-left."
      },
      {
        category: "Data Structures & Algorithms",
        subcategory: "Hash Tables",
        difficulty: "Easy",
        question_text: "What is the average time complexity of insertion, deletion, and lookup operations in a well-distributed Hash Table?",
        option_a: "O(1) average time",
        option_b: "O(log N) average time",
        option_c: "O(N) average time",
        option_d: "O(N^2) average time",
        correct_answer: "O(1) average time",
        explanation: "With a uniform hash function and appropriate load factor resizing, hash table lookup, insert, and delete operate in O(1) expected time."
      },

      // =========================================================================
      // 5. REACT & MODERN FRONTEND
      // =========================================================================
      {
        category: "React & Modern Frontend",
        subcategory: "React Hooks & State",
        difficulty: "Medium",
        question_text: "Why should `useEffect` dependency arrays include all mutable values used inside the effect function?",
        option_a: "To prevent stale closures from reading outdated state or prop values across re-renders",
        option_b: "To convert synchronous code into Web Workers",
        option_c: "To compile JSX into bytecode",
        option_d: "To bypass the React virtual DOM",
        correct_answer: "To prevent stale closures from reading outdated state or prop values across re-renders",
        explanation: "Missing dependencies cause the effect closure to capture values from previous renders, resulting in subtle state desynchronization bugs."
      },
      {
        category: "React & Modern Frontend",
        subcategory: "Virtual DOM & Fiber",
        difficulty: "Hard",
        question_text: "What is the primary objective of React Fiber architecture introduced in React 16+?",
        option_a: "Enabling incremental, interruptible rendering to keep high-priority user interactions and animations responsive",
        option_b: "Replacing JavaScript with WebAssembly",
        option_c: "Removing component re-rendering entirely",
        option_d: "Enabling multi-threaded database queries in the browser",
        correct_answer: "Enabling incremental, interruptible rendering to keep high-priority user interactions and animations responsive",
        explanation: "React Fiber splits work into chunks called fibers, allowing React to pause, prioritize, and resume virtual DOM reconciliation without blocking the main browser thread."
      },
      {
        category: "React & Modern Frontend",
        subcategory: "Performance Optimization",
        difficulty: "Medium",
        question_text: "What is the purpose of `useMemo` and `useCallback` in React applications?",
        option_a: "`useMemo` memoizes calculated values; `useCallback` memoizes function instance references to prevent unnecessary child re-renders",
        option_b: "`useMemo` stores files on disk; `useCallback` calls backend APIs",
        option_c: "`useCallback` forces a full page reload",
        option_d: "`useMemo` converts strings to numbers",
        correct_answer: "`useMemo` memoizes calculated values; `useCallback` memoizes function instance references to prevent unnecessary child re-renders",
        explanation: "`useMemo` caches the result of an expensive calculation. `useCallback` preserves stable function identities passed as props to memoized children (`React.memo`)."
      },

      // =========================================================================
      // 6. OOP & DESIGN PATTERNS
      // =========================================================================
      {
        category: "OOP & Design Patterns",
        subcategory: "SOLID Principles",
        difficulty: "Medium",
        question_text: "What does the Liskov Substitution Principle (LSP) in SOLID design dictate?",
        option_a: "Derived / child classes must be substitutable for their base / parent classes without altering the correctness of the program",
        option_b: "A class should have only one reason to change",
        option_c: "Classes should be open for modification and closed for extension",
        option_d: "Clients should be forced to depend on interfaces they do not use",
        correct_answer: "Derived / child classes must be substitutable for their base / parent classes without altering the correctness of the program",
        explanation: "LSP guarantees that any instance of a parent class can be replaced by an instance of a subclass without breaking preconditions or postconditions."
      },
      {
        category: "OOP & Design Patterns",
        subcategory: "Design Patterns",
        difficulty: "Medium",
        question_text: "Which Creational Design Pattern ensures that a class has only ONE global instance and provides a single access point to it?",
        option_a: "Singleton Pattern",
        option_b: "Factory Method Pattern",
        option_c: "Observer Pattern",
        option_d: "Adapter Pattern",
        correct_answer: "Singleton Pattern",
        explanation: "Singleton uses a private constructor, static instance reference, and public static `getInstance()` method to enforce single-instance creation."
      },
      {
        category: "OOP & Design Patterns",
        subcategory: "Design Patterns",
        difficulty: "Medium",
        question_text: "Which Behavioral Design Pattern defines a one-to-many dependency between objects so that when one object changes state, all its dependents are notified automatically?",
        option_a: "Observer Pattern",
        option_b: "Decorator Pattern",
        option_c: "Facade Pattern",
        option_d: "Builder Pattern",
        correct_answer: "Observer Pattern",
        explanation: "Observer (used in event listeners, RxJS, state management) maintains a list of subscribers and notifies them on subject state mutations."
      },

      // =========================================================================
      // 7. APTITUDE & LOGICAL REASONING
      // =========================================================================
      {
        category: "Aptitude & Logical Reasoning",
        subcategory: "Time & Work",
        difficulty: "Medium",
        question_text: "A can complete a piece of work in 12 days, and B can complete the same work in 24 days. Working together, in how many days will they finish the work?",
        option_a: "8 days",
        option_b: "6 days",
        option_c: "10 days",
        option_d: "9 days",
        correct_answer: "8 days",
        explanation: "A's 1-day work = 1/12. B's 1-day work = 1/24. Combined 1-day work = 1/12 + 1/24 = 3/24 = 1/8. Total days required = 8 days."
      },
      {
        category: "Aptitude & Logical Reasoning",
        subcategory: "Speed & Distance",
        difficulty: "Medium",
        question_text: "A train traveling at 72 km/h crosses a 200-meter long platform in 20 seconds. What is the length of the train?",
        option_a: "200 meters",
        option_b: "150 meters",
        option_c: "250 meters",
        option_d: "300 meters",
        correct_answer: "200 meters",
        explanation: "Speed in m/s = 72 * (5/18) = 20 m/s. Total distance crossed in 20s = 20 * 20 = 400 meters. Train length = 400 - 200 (platform) = 200 meters."
      },
      {
        category: "Aptitude & Logical Reasoning",
        subcategory: "Probability",
        difficulty: "Easy",
        question_text: "Two fair six-sided dice are rolled simultaneously. What is the probability of getting a sum equal to 7?",
        option_a: "1/6",
        option_b: "1/12",
        option_c: "5/36",
        option_d: "7/36",
        correct_answer: "1/6",
        explanation: "Total outcomes = 36. Favorable outcomes for sum 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 pairs. Probability = 6/36 = 1/6."
      },

      // =========================================================================
      // 8. JAVASCRIPT
      // =========================================================================
      {
        category: "JavaScript",
        subcategory: "Event Loop & Async",
        difficulty: "Medium",
        question_text: "In the JavaScript Event Loop, what is the execution priority between Microtasks (Promises, queueMicrotask) and Macrotasks (setTimeout, setInterval)?",
        option_a: "All Microtasks in the microtask queue are executed to completion before the next Macrotask is processed from the task queue",
        option_b: "Macrotasks always execute before Microtasks",
        option_c: "Microtasks and Macrotasks run in parallel on separate threads",
        option_d: "setTimeout has higher priority than Promise.then()",
        correct_answer: "All Microtasks in the microtask queue are executed to completion before the next Macrotask is processed from the task queue",
        explanation: "After each task completes, the engine exhausts the entire microtask queue before rendering or fetching the next macrotask."
      },
      {
        category: "JavaScript",
        subcategory: "Closures & Scope",
        difficulty: "Medium",
        question_text: "What is a Closure in JavaScript?",
        option_a: "A function bundled together with references to its surrounding lexical environment, allowing it to access outer variables even after the outer function has closed",
        option_b: "A method to close browser tabs",
        option_c: "An error caused by unclosed parentheses",
        option_d: "A way to delete global variables",
        correct_answer: "A function bundled together with references to its surrounding lexical environment, allowing it to access outer variables even after the outer function has closed",
        explanation: "In JS, functions retain a reference to the scope in which they were created, preserving variables for later invocations."
      },

      // =========================================================================
      // 9. PYTHON & BACKEND
      // =========================================================================
      {
        category: "Python & Backend",
        subcategory: "Concurrency & GIL",
        difficulty: "Medium",
        question_text: "What is the Global Interpreter Lock (GIL) in CPython, and how does it impact multi-threaded CPU-bound programs?",
        option_a: "A mutex that prevents multiple native threads from executing Python bytecodes simultaneously, limiting CPU-bound multithreading to a single core",
        option_b: "A security lock that encrypts Python scripts",
        option_c: "A database lock used by SQLite",
        option_d: "A memory leak detector",
        correct_answer: "A mutex that prevents multiple native threads from executing Python bytecodes simultaneously, limiting CPU-bound multithreading to a single core",
        explanation: "The GIL protects CPython's reference counts. For CPU-bound parallel workloads, developers use multiprocessing or C extensions instead of threads."
      },
      {
        category: "Python & Backend",
        subcategory: "Generators & Memory",
        difficulty: "Easy",
        question_text: "What is the difference between `yield` and `return` in a Python function?",
        option_a: "`yield` pauses the function and produces a generator object preserving local state; `return` terminates function execution and sends a value back",
        option_b: "`yield` can only be used in lambda expressions",
        option_c: "`return` does not allow sending values",
        option_d: "There is no difference",
        correct_answer: "`yield` pauses the function and produces a generator object preserving local state; `return` terminates function execution and sends a value back",
        explanation: "`yield` enables lazy evaluation and low memory consumption by generating one item on-demand upon each `next()` call."
      },

      // =========================================================================
      // 10. SYSTEM DESIGN & ARCHITECTURE
      // =========================================================================
      {
        category: "System Design & Architecture",
        subcategory: "Distributed Systems & CAP",
        difficulty: "Medium",
        question_text: "According to the CAP Theorem, in the presence of a Network Partition (P), a distributed data store must choose between which two properties?",
        option_a: "Consistency (C) or Availability (A)",
        option_b: "Performance (P) or Cost (C)",
        option_c: "Security (S) or Speed (S)",
        option_d: "Durability (D) or Atomicity (A)",
        correct_answer: "Consistency (C) or Availability (A)",
        explanation: "When network communication between cluster partitions fails (P), the system can either refuse requests to maintain strict consistency (CP) or serve potentially stale data (AP)."
      },
      {
        category: "System Design & Architecture",
        subcategory: "Caching Strategies",
        difficulty: "Medium",
        question_text: "What is the difference between Write-Through and Write-Back (Write-Behind) caching strategies?",
        option_a: "Write-Through writes synchronously to both cache and DB before returning; Write-Back writes to cache immediately and flushes asynchronously to DB later",
        option_b: "Write-Through deletes cache entries on update",
        option_c: "Write-Back does not store data in RAM",
        option_d: "There is no difference between them",
        correct_answer: "Write-Through writes synchronously to both cache and DB before returning; Write-Back writes to cache immediately and flushes asynchronously to DB later",
        explanation: "Write-Through provides strong data safety with higher write latency. Write-Back provides ultra-fast writes with risk of data loss if the cache node crashes before DB sync."
      }
    ];

    let insertedCount = 0;
    for (const q of questionsBank) {
      const existing = await pool.query(
        `SELECT id FROM questions WHERE LOWER(question_text) = LOWER($1) LIMIT 1`,
        [q.question_text]
      );

      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO questions (category, subcategory, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [q.category, q.subcategory, q.difficulty, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.explanation]
        );
        insertedCount++;
      }
    }

    const totalCount = await pool.query(`SELECT count(id) FROM questions`);
    console.log(`🎉 Cleanup & Seeding Complete! Inserted ${insertedCount} new authentic questions. Total in database: ${totalCount.rows[0].count}`);

  } catch (err) {
    console.error("Cleanup & Seed Error:", err);
  } finally {
    await pool.end();
  }
}

cleanAndSeedQuestions();
