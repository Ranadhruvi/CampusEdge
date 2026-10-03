const pool = require('../db');

// Multi-category structured questions generator
const categoriesToGenerate = [
  // 1. Data Structures & Algorithms
  {
    category: "Data Structures & Algorithms",
    items: [
      { q: "What is the time complexity of building a Suffix Array of a string of length N using the DC3 / Skew algorithm?", a: "O(N)", b: "O(N log N)", c: "O(N^2)", d: "O(N log^2 N)", ans: "O(N)", exp: "The DC3/Skew algorithm constructs suffix arrays in strictly linear O(N) time." },
      { q: "Which data structure can evaluate Range Minimum Queries (RMQ) in O(1) time after O(N log N) preprocessing?", a: "Sparse Table", b: "Binary Heap", c: "Linked List", d: "Queue", ans: "Sparse Table", exp: "Sparse tables use binary exponent power ranges to answer static idempotent range queries like min/max/gcd in O(1) query time." },
      { q: "What is the amortized cost per operation in a Splay Tree?", a: "O(log N)", b: "O(1)", c: "O(N)", d: "O(sqrt N)", ans: "O(log N)", exp: "Splaying moves accessed elements to the root using tree rotations, yielding O(log N) amortized time." },
      { q: "What is the maximum number of edges in a simple planar graph with V vertices (for V >= 3)?", a: "3V - 6", b: "2V - 4", c: "V^2 / 2", d: "V * log V", ans: "3V - 6", exp: "By Euler's planar formula (V - E + F = 2), the maximum number of edges without crossing is E <= 3V - 6." },
      { q: "In Heavy-Light Decomposition (HLD) of a tree with N nodes, any path from a node to the root crosses at most how many light edges?", a: "O(log N)", b: "O(N)", c: "O(1)", d: "O(sqrt N)", ans: "O(log N)", exp: "A light edge leads to a subtree with size <= half the parent's subtree, halving node count at each light step." },
      { q: "What is the space complexity of Morris In-Order Tree Traversal?", a: "O(1) auxiliary space", b: "O(N)", c: "O(log N)", d: "O(N^2)", ans: "O(1) auxiliary space", exp: "Morris traversal creates temporary threaded pointers using right pointers of in-order predecessors to traverse in O(1) space." },
      { q: "Which algorithm finds the Maximum Flow in a flow network in O(V * E^2) time using BFS for augmenting paths?", a: "Edmonds-Karp Algorithm", b: "Ford-Fulkerson with DFS", c: "Dinic's Algorithm", d: "Push-Relabel", ans: "Edmonds-Karp Algorithm", exp: "Edmonds-Karp is an implementation of Ford-Fulkerson that uses BFS to find shortest augmenting paths in O(V * E^2)." },
      { q: "What is the time complexity of the Fenwick Tree (Binary Indexed Tree) for point updates and prefix sum queries?", a: "O(log N)", b: "O(1)", c: "O(N)", d: "O(N log N)", ans: "O(log N)", exp: "Fenwick trees traverse tree levels via bitwise operations (`i += i & -i`), completing both updates and queries in O(log N) time and O(N) space." },
      { q: "What is the maximum number of comparison operations required to find both the minimum and maximum of an array of N elements?", a: "3N/2 - 2 comparisons", b: "2N comparisons", c: "N^2 comparisons", d: "N log N comparisons", ans: "3N/2 - 2 comparisons", exp: "Comparing elements in pairs first and then comparing larger with current max and smaller with current min achieves 3N/2 - 2 comparisons." },
      { q: "In the Convex Hull Graham Scan algorithm, what is the overall time complexity for N 2D points?", a: "O(N log N)", b: "O(N)", c: "O(N^2)", d: "O(N^3)", ans: "O(N log N)", exp: "Sorting points by polar angle with respect to the lowest point takes O(N log N), followed by a linear O(N) stack scan." },
      { q: "What is the purpose of the Manacher's Algorithm?", a: "Finding all palindromic substrings in linear O(N) time", b: "Sorting strings alphabetically", c: "Compressing images", d: "Finding minimum spanning trees", ans: "Finding all palindromic substrings in linear O(N) time", exp: "Manacher's algorithm exploits palindrome symmetry to compute the longest palindromic substring in O(N) time." },
      { q: "What is the time complexity of Hungarian Algorithm for Maximum Bipartite Matching with weighted edges?", a: "O(V^3)", b: "O(V + E)", c: "O(E log V)", d: "O(2^V)", ans: "O(V^3)", exp: "The Hungarian method solves the assignment problem in O(V^3) time using potentials and shortest augmenting paths." }
    ]
  },
  // 2. System Design & Architecture
  {
    category: "System Design & Architecture",
    items: [
      { q: "What is the difference between Polling, Long Polling, and WebSockets for real-time web applications?", a: "Polling asks periodically; Long Polling holds HTTP open until data arrives; WebSockets establish a full-duplex persistent bidirectional TCP channel", b: "WebSockets only work on mobile phones", c: "Polling is always faster than WebSockets", d: "Long polling requires UDP", ans: "Polling asks periodically; Long Polling holds HTTP open until data arrives; WebSockets establish a full-duplex persistent bidirectional TCP channel", exp: "WebSockets eliminate repeated HTTP header overhead by maintaining a persistent bidirectional connection." },
      { q: "What is Database Connection Pooling (e.g. HikariCP, pgBouncer), and why is it necessary?", a: "To delete slow queries", b: "Maintaining a cache of open database connections to avoid the high latency of establishing a new TCP connection and TLS handshake for every query", c: "To replicate databases to AWS", d: "To convert SQL to MongoDB", ans: "Maintaining a cache of open database connections to avoid the high latency of establishing a new TCP connection and TLS handshake for every query", exp: "Creating DB connections consumes CPU and memory. Connection pools reuse pre-warmed sockets to serve high QPS." },
      { q: "What is the Gossip Protocol used for in distributed clusters (e.g. Cassandra, DynamoDB)?", a: "Transmitting user passwords", b: "Decentralized peer-to-peer node discovery, failure detection, and cluster state dissemination without a master coordinator", c: "Compressing video files", d: "Generating SSL certificates", ans: "Decentralized peer-to-peer node discovery, failure detection, and cluster state dissemination without a master coordinator", exp: "Gossip protocols scale to thousands of nodes with no single point of failure by exchanging randomized periodic heartbeats." },
      { q: "What is the Single Point of Failure (SPOF) in system design, and how is it eliminated?", a: "A single bottleneck whose failure brings down the entire system; eliminated via redundancy, automated failover, and multi-zone clustering", b: "A slow computer keyboard", c: "A missing semicolon in code", d: "A high CPU temperature", ans: "A single bottleneck whose failure brings down the entire system; eliminated via redundancy, automated failover, and multi-zone clustering", exp: "Redundant active-passive or active-active components paired with health checks ensure seamless failover." },
      { q: "What is the purpose of Shard Rebalancing in distributed NoSQL databases?", a: "Redistributing data partitions and load across nodes when new cluster instances are added or removed to prevent hot shards", b: "Deleting old database records", c: "Formatting hard drives", d: "Encrypting database indexes", ans: "Redistributing data partitions and load across nodes when new cluster instances are added or removed to prevent hot shards", exp: "Rebalancing migrates virtual partitions dynamically to maintain even storage and I/O distribution across nodes." },
      { q: "In distributed logging systems, what is the ELK / EFK stack?", a: "Elasticsearch (search engine), Logstash/Fluentd (log collector/parser), Kibana (visualization dashboard)", b: "Encryption, Loading, Key generation", c: "Email, Links, Knowledge base", d: "Ethernet, LAN, Kernel", ans: "Elasticsearch (search engine), Logstash/Fluentd (log collector/parser), Kibana (visualization dashboard)", exp: "ELK/EFK aggregates, indexes, and visualizes real-time log streams across thousands of microservices." }
    ]
  },
  // 3. Database Management & SQL
  {
    category: "Database Management & SQL",
    items: [
      { q: "What is an Index-Organized Table (IOT) / Clustered Index Table?", a: "A table whose physical row data is stored directly in the leaf blocks of its B-Tree primary key index", b: "A temporary table stored in RAM", c: "A table without a primary key", d: "A table stored in text files", ans: "A table whose physical row data is stored directly in the leaf blocks of its B-Tree primary key index", exp: "IOTs eliminate the secondary table heap lookup since the leaf nodes contain the full row data." },
      { q: "What is the SQL `COALESCE()` function used for?", a: "Returns the first non-NULL expression from a list of arguments", b: "Combines two tables into one", c: "Converts strings to uppercase", d: "Counts the number of rows", ans: "Returns the first non-NULL expression from a list of arguments", exp: "`COALESCE(address, hometown, 'Unknown')` returns the first valid string that is not NULL." },
      { q: "What is the purpose of database Partitioning (e.g. Range, List, Hash Partitioning)?", a: "Splitting large tables into smaller, manageable sub-tables to improve query performance via partition pruning and faster maintenance", b: "Deleting duplicate rows", c: "Encrypting column names", d: "Compressing images", ans: "Splitting large tables into smaller, manageable sub-tables to improve query performance via partition pruning and faster maintenance", exp: "Partition pruning allows the SQL engine to skip scanning irrelevant partitions entirely during range queries." },
      { q: "What is a Deadlock in SQL transactions, and how does the database engine resolve it?", a: "Two transactions hold locks that the other needs in a circular wait; the database engine detects the cycle and aborts/rolls back one transaction (victim)", b: "A physical cable failure", c: "An invalid password", d: "A corrupted table index", ans: "Two transactions hold locks that the other needs in a circular wait; the database engine detects the cycle and aborts/rolls back one transaction (victim)", exp: "Deadlock detectors periodically inspect lock wait-for graphs and terminate one transaction to break the cycle." },
      { q: "What is a Foreign Key `ON DELETE CASCADE` action?", a: "Automatically deletes matching child rows when the referenced parent row is deleted", b: "Prevents parent deletion", c: "Sets foreign key to NULL", d: "Sends an email alert", ans: "Automatically deletes matching child rows when the referenced parent row is deleted", exp: "CASCADE maintains referential integrity by cleaning up dependent child records automatically." }
    ]
  },
  // 4. Operating Systems
  {
    category: "Operating Systems",
    items: [
      { q: "What is the difference between Paging and Segmentation in operating systems memory management?", a: "Paging divides memory into fixed-size physical blocks (Pages/Frames); Segmentation divides memory into variable-size logical modules (code, stack, data)", b: "Paging uses hard drives; Segmentation uses RAM", c: "Segmentation has internal fragmentation; Paging has external fragmentation", d: "There is no difference", ans: "Paging divides memory into fixed-size physical blocks (Pages/Frames); Segmentation divides memory into variable-size logical modules (code, stack, data)", exp: "Paging is hardware-oriented and eliminates external fragmentation. Segmentation reflects program logical divisions." },
      { q: "What is the purpose of the OS Syscall `mmap()` (Memory Mapping)?", a: "Mapping files or devices directly into a process's virtual address space, enabling high-performance zero-copy file I/O", b: "Drawing graphics on the monitor", c: "Rebooting the computer", d: "Configuring Wi-Fi passwords", ans: "Mapping files or devices directly into a process's virtual address space, enabling high-performance zero-copy file I/O", exp: "`mmap()` avoids user-to-kernel buffer copying by reading/writing to memory pages backed directly by file storage." },
      { q: "What is a 'Spinlock' in multi-threaded OS kernels, and when is it preferred over a blocking mutex?", a: "A lock that repeatedly polls in a CPU loop (busy waiting); preferred for very short critical sections where context-switching overhead exceeds wait time", b: "A lock that encrypts disk sectors", c: "A lock used only on single-core CPUs", d: "A lock that deletes expired threads", ans: "A lock that repeatedly polls in a CPU loop (busy waiting); preferred for very short critical sections where context-switching overhead exceeds wait time", exp: "Spinlocks avoid the heavy latency of putting a thread to sleep and waking it up when the lock is held for just a few CPU cycles." },
      { q: "What is the role of the Init process (PID 1) in Linux (e.g. systemd)?", a: "The ancestor of all user-space processes that initializes the system, adopts orphaned child processes, and manages system services", b: "A command-line text editor", c: "A network routing daemon", d: "A memory cleaner", ans: "The ancestor of all user-space processes that initializes the system, adopts orphaned child processes, and manages system services", exp: "PID 1 is spawned directly by the kernel on boot and is responsible for adopting and reaping orphaned processes." }
    ]
  },
  // 5. Computer Networks
  {
    category: "Computer Networks",
    items: [
      { q: "What is the MTU (Maximum Transmission Unit) of standard Ethernet frames?", a: "1500 bytes", b: "64 bytes", c: "4096 bytes", d: "9000 bytes", ans: "1500 bytes", exp: "Standard Ethernet specifies an MTU of 1500 bytes. Packets larger than the MTU are fragmented across IP networks unless DF (Don't Fragment) is set." },
      { q: "What is DHCP (Dynamic Host Configuration Protocol) used for?", a: "Automatically assigning dynamic IP addresses, default gateways, and DNS server IPs to client devices on a local network", b: "Encrypting hard drives", c: "Streaming audio files", d: "Testing internet speed", ans: "Automatically assigning dynamic IP addresses, default gateways, and DNS server IPs to client devices on a local network", exp: "DHCP uses DORA (Discover, Offer, Request, Acknowledge) broadcasts over UDP ports 67/68 to configure network clients." },
      { q: "What is a Reverse Proxy (e.g. Nginx, HAProxy), and how does it differ from a Forward Proxy?", a: "A forward proxy sits in front of clients to access the internet; a reverse proxy sits in front of backend web servers to handle load balancing, SSL termination, and caching", b: "Reverse proxies only run on Windows", c: "Forward proxies encrypt passwords", d: "There is no difference", ans: "A forward proxy sits in front of clients to access the internet; a reverse proxy sits in front of backend web servers to handle load balancing, SSL termination, and caching", exp: "Reverse proxies shield internal server topologies from public clients and optimize inbound traffic." },
      { q: "What is the purpose of the TCP FIN and ACK handshake during connection termination?", a: "Gracefully closing both directions of the full-duplex TCP stream (4-way termination handshake)", b: "Starting a new download", c: "Encrypting packets", d: "Resetting router memory", ans: "Gracefully closing both directions of the full-duplex TCP stream (4-way termination handshake)", exp: "Each side sends a FIN packet and receives an ACK, ensuring all buffered in-flight data is flushed before closing sockets." }
    ]
  },
  // 6. Aptitude & Placement Reasoning
  {
    category: "Aptitude & Logical Reasoning",
    items: [
      { q: "A vendor sells 2 items at $99 each. On one he gains 10% and on the other he loses 10%. What is his overall gain or loss percentage?", a: "1% loss", b: "1% gain", c: "No gain no loss", d: "2% loss", ans: "1% loss", exp: "When two items are sold at the same price with equal gain% and loss% of x, there is always an overall loss of (x/10)^2 % = (10/10)^2 = 1% loss." },
      { q: "How many times do the hour and minute hands of a clock overlap (coincide) in a 24-hour day?", a: "22 times", b: "24 times", c: "12 times", d: "44 times", ans: "22 times", exp: "Due to the continuous movement, the hands overlap 11 times in every 12-hour period (they overlap once between 11 and 1 at 12:00), making 22 times in 24 hours." },
      { q: "In a group of 100 people, 60 drink tea, 50 drink coffee, and 20 drink both. How many people drink neither tea nor coffee?", a: "10", b: "15", c: "20", d: "5", ans: "10", exp: "Union = Tea + Coffee - Both = 60 + 50 - 20 = 90. People drinking neither = Total (100) - 90 = 10." },
      { q: "A 300-meter train running at 54 km/h crosses a platform in 36 seconds. What is the length of the platform?", a: "240 meters", b: "200 meters", c: "250 meters", d: "300 meters", ans: "240 meters", exp: "Speed = 54 * (5/18) = 15 m/s. Total distance = Speed * Time = 15 * 36 = 540m. Platform length = 540 - 300 = 240 meters." }
    ]
  }
];

async function seedMassive() {
  try {
    console.log("🌱 Generating and inserting extensive question suite...");
    let added = 0;
    let skipped = 0;

    for (const group of categoriesToGenerate) {
      for (const item of group.items) {
        const check = await pool.query(
          `SELECT id FROM questions WHERE LOWER(TRIM(question_text)) = LOWER(TRIM($1)) LIMIT 1;`,
          [item.q.trim()]
        );

        if (check.rows.length === 0) {
          await pool.query(
            `INSERT INTO questions (category, subcategory, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT DO NOTHING;`,
            [
              group.category,
              "Core Technical",
              "Medium",
              item.q.trim(),
              item.a.trim(),
              item.b.trim(),
              item.c.trim(),
              item.d.trim(),
              item.ans.trim(),
              item.exp.trim()
            ]
          );
          added++;
        } else {
          skipped++;
        }
      }
    }

    // Run generateMassiveBank dataset as well
    const bankRes = await pool.query(`SELECT COUNT(*) as total FROM questions;`);
    console.log(`✅ Success: Added ${added} new unique questions, skipped ${skipped} duplicates.`);
    console.log(`🎉 Total Pure Questions in Bank: ${bankRes.rows[0].total}`);

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

seedMassive();
