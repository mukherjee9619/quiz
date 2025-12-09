const http = require("http");
const { MongoClient, ObjectId } = require("mongodb");

// ===== MongoDB connection =====
const url = "mongodb+srv://KillerTuri:nLfnCZdP1wSCtTDj@cluster0.ytyq8p5.mongodb.net/";
const client = new MongoClient(url);
let db;

client
  .connect()
  .then(() => {
    console.log("✅ Connected to MongoDB");
    db = client.db("quizDB");
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const server = http.createServer(async (req, res) => {
  // ===== CORS =====
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // Helper: Parse JSON body
    const parseBody = () =>
      new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            resolve(JSON.parse(body || "{}"));
          } catch {
            reject("Invalid JSON format");
          }
        });
      });

    // ===================================================
    // REGISTER
    // ===================================================
    if (req.method === "POST" && req.url === "/register") {
      const data = await parseBody();
      const users = db.collection("users");

      const existing = await users.findOne({ email: data.email });
      if (existing) {
        res.writeHead(409, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "⚠️ User already exists" }));
        return;
      }

      const result = await users.insertOne({
        fullname: data.fullname,
        email: data.email,
        password: data.password,
        role: "Admin",
        createdAt: new Date(),
      });

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "🎉 Registration Successful!",
          insertedId: result.insertedId,
        })
      );
    }

    // ===================================================
    // LOGIN
    // ===================================================
    else if (req.method === "POST" && req.url === "/login") {
      const { email, password } = await parseBody();
      const users = db.collection("users");

      const user = await users.findOne({ email, password });
      if (user) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "✅ Login Successful!",
            fullname: user.fullname,
            role: user.role,
            email: user.email,
          })
        );
      } else {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "❌ Invalid Email or Password!" }));
      }
    }

    // ===================================================
    // ADD SUBJECT
    // ===================================================
    else if (req.method === "POST" && req.url === "/api/admin/subjects") {
      const data = await parseBody();
      const subjects = db.collection("subjects");

      // ---- Check if subject already exists ----
      const existing = await subjects.findOne({ name: data.name.trim().toLowerCase() });

      if (existing) {
        res.writeHead(409, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "⚠️ Subject already exists!" }));
        return;
      }

      // ---- Insert new subject ----
      const result = await subjects.insertOne({
        name: data.name.trim().toLowerCase(),
        description: data.description,
        createdAt: new Date(),
      });

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "📘 Subject created!",
          insertedId: result.insertedId,
        })
      );
    }


    // ===================================================
    // GET ALL SUBJECTS
    // ===================================================
    else if (req.method === "GET" && req.url === "/api/admin/subjects") {
      const subjects = await db.collection("subjects").find({}).toArray();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(subjects));
    }

    // ===================================================
    // SUBJECT BY ID (GET + DELETE)
    // ===================================================
    else if (req.url.startsWith("/api/admin/subjects/")) {
      const parts = req.url.split("/");
      const id = parts[4];
      const subjects = db.collection("subjects");

      if (req.method === "GET") {
        try {
          const subject = await subjects.findOne({ _id: new ObjectId(id) });

          if (subject) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(subject));
          } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "❌ Subject not found!" }));
          }
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "⚠️ Invalid ID format!" }));
        }
      }

      if (req.method === "DELETE") {
        try {
          const result = await subjects.deleteOne({ _id: new ObjectId(id) });

          if (result.deletedCount === 1) {
            await db.collection("questions").deleteMany({ subjectId: id });

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "🗑️ Subject deleted!" }));
          } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "❌ Subject not found!" }));
          }
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "⚠️ Invalid ID format!" }));
        }
      }
    }

    // ===================================================
    // ADD QUESTION
    // ===================================================
    else if (req.method === "POST" && req.url === "/api/admin/questions") {
      const data = await parseBody();
      const questions = db.collection("questions");

      const result = await questions.insertOne({
        subjectId: data.subjectId,
        question: data.question,
        options: data.options,
        correctAnswer: data.correctAnswer,
        createdAt: new Date(),
      });

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "❓ Question added!",
          insertedId: result.insertedId,
        })
      );
    }

    // ===================================================
    // GET ALL QUESTIONS
    // ===================================================
    else if (req.method === "GET" && req.url === "/api/admin/questions") {
      const questions = await db.collection("questions").find({}).toArray();
      const subjects = await db.collection("subjects").find({}).toArray();

      // Create a map for fast lookup
      const subjectMap = {};
      subjects.forEach(s => {
        subjectMap[s._id.toString()] = s.name;
      });

      const final = questions.map(q => ({
        ...q,
        subjectName: subjectMap[q.subjectId] || "Unknown"
      }));

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(final));
    }


    // ===================================================
    // QUESTIONS BY SUBJECT
    // ===================================================
    else if (
      req.method === "GET" &&
      req.url.startsWith("/api/admin/questions/")
    ) {
      const subjectId = req.url.split("/")[3];

      const questions = await db
        .collection("questions")
        .find({ subjectId })
        .toArray();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(questions));
    }

    // ===================================================
    // DELETE QUESTION
    // ===================================================
    else if (
      req.method === "DELETE" &&
      req.url.startsWith("/api/admin/questions/")
    ) {
      const id = req.url.split("/")[3];

      try {
        const result = await db
          .collection("questions")
          .deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "🗑️ Question deleted!" }));
        } else {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "❌ Question not found!" }));
        }
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "⚠️ Invalid question ID!" }));
      }
    }

    // ===================================================
    // ⭐⭐⭐ ADMIN DASHBOARD LIVE STATS (NEW)
    // ===================================================
    else if (req.method === "GET" && req.url === "/api/admin/stats") {

      const subjects = await db.collection("subjects").countDocuments();
      const questions = await db.collection("questions").countDocuments();

      // ⭐ Count ONLY normal users (exclude admins)
      const users = await db.collection("users").countDocuments({ role: "user" });

      const results = await db.collection("results").countDocuments();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          subjects,
          questions,
          users,
          results,
        })
      );
    }


    // ===================================================
    // INVALID ROUTE
    // ===================================================
    else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Route not found" }));
    }
  } catch (err) {
    console.error("❌ Error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal Server Error" }));
  }
});

server.listen(8081, () => {
  console.log("🚀 Quiz App Server running at http://127.0.0.1:8081/");
});
