const http = require("http");
const { MongoClient, ObjectId } = require("mongodb");
const multer = require("multer");
const upload = multer();

// ===== MongoDB connection =====
const url = "mongodb://127.0.0.1:27017";
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
        return res.end(JSON.stringify({ message: "⚠️ User already exists" }));
      }

      const result = await users.insertOne({
        fullname: data.fullname,
        email: data.email,
        password: data.password,
        role: "Admin",
        createdAt: new Date(),
      });

      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(
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
      if (!user) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ message: "❌ Invalid Email or Password!" })
        );
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          message: "✅ Login Successful!",
          fullname: user.fullname,
          role: user.role,
          email: user.email,
        })
      );
    }

    // ===================================================
    // ADD SUBJECT
    // ===================================================
    else if (req.method === "POST" && req.url === "/api/admin/subjects") {
      const data = await parseBody();
      const subjects = db.collection("subjects");

      const existing = await subjects.findOne({
        name: data.name.trim().toLowerCase(),
      });

      if (existing) {
        res.writeHead(409, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ message: "⚠️ Subject already exists!" })
        );
      }

      const result = await subjects.insertOne({
        name: data.name.trim().toLowerCase(),
        description: data.description,
        createdAt: new Date(),
      });

      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(
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
      return res.end(JSON.stringify(subjects));
    }

    // ===================================================
    // DELETE SUBJECT + ITS QUESTIONS
    // ===================================================
    else if (
      req.url.startsWith("/api/admin/subjects/") &&
      req.method === "DELETE"
    ) {
      const id = req.url.split("/")[4];

      try {
        const result = await db
          .collection("subjects")
          .deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "❌ Subject not found!" }));
        }

        await db.collection("questions").deleteMany({ subjectId: id });

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "🗑️ Subject deleted!" }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "⚠️ Invalid ID format!" }));
      }
    }

    // ===================================================
    // ADD QUESTION
    // ===================================================
    else if (req.method === "POST" && req.url === "/api/admin/questions") {
      const data = await parseBody();

      const result = await db.collection("questions").insertOne({
        subjectId: data.subjectId,
        question: data.question,
        options: data.options,
        correctAnswer: data.correctAnswer,
        createdAt: new Date(),
      });

      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(
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

      const subjectMap = {};
      subjects.forEach((s) => (subjectMap[s._id.toString()] = s.name));

      const final = questions.map((q) => ({
        ...q,
        subjectName: subjectMap[q.subjectId] || "Unknown",
      }));

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(final));
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

        if (result.deletedCount === 0) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "❌ Question not found!" }));
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "🗑️ Question deleted!" }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "⚠️ Invalid question ID!" }));
      }
    }

    // ===================================================
    // ⭐ FIXED: IMPORT QUESTIONS FROM JSON (YOUR FORMAT)
    // ===================================================
    else if (
      req.method === "POST" &&
      req.url === "/api/admin/questions/import"
    ) {
      upload.single("file")(req, res, async () => {
        try {
          if (!req.file) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "No file uploaded" }));
          }
          const subjects = await db.collection("subjects").find({}).toArray();

          const subjectMap = {};
          subjects.forEach((s) => (subjectMap[s._id.toString()] = s.name));

          // JSON text
          const jsonText = req.file.buffer.toString("utf8");

          const json = JSON.parse(jsonText);

          if (!json.questions || !Array.isArray(json.questions)) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(
              JSON.stringify({
                message: "Invalid format: expected {id, title, questions[]}",
              })
            );
          }

          const subjectName = json.title.toLowerCase();

          let subject = await db
            .collection("subjects")
            .findOne({ name: subjectName });
          if (!subject) {
            const sub = await db.collection("subjects").insertOne({
              name: subjectName,
              description: "",
              createdAt: new Date(),
            });
            subject = { _id: sub.insertedId };
          }

          const formattedQuestions = json.questions.map((q) => ({
            subjectId: subject._id.toString(),
            subjectName: subjectMap[subject._id] || "Unknown",
            question: q.q,
            options: q.options,
            correctAnswer: q.answer,
            createdAt: new Date(),
          }));

          const result = await db
            .collection("questions")
            .insertMany(formattedQuestions);

          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              message: "📥 Questions imported successfully!",
              inserted: result.insertedCount,
            })
          );
        } catch (err) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Invalid JSON file!" }));
        }
      });
    }

    // ===================================================
    // INVALID ROUTE
    // ===================================================
    else {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Route not found" }));
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
