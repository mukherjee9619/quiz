const http = require("http");
const { MongoClient, ObjectId } = require("mongodb");
const multer = require("multer");
const upload = multer();

// ===== MongoDB connection =====

const url = "mongodb://127.0.0.1:27017";
// const url = "mongodb+srv://KillerTuri:nLfnCZdP1wSCtTDj@cluster0.ytyq8p5.mongodb.net/";
const client = new MongoClient(url);
let db;

client.connect().then(() => {
  console.log("✅ Connected to MongoDB");
  db = client.db("quizDB");
});

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
    const parseBody = () =>
      new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            resolve(JSON.parse(body || "{}"));
          } catch {
            reject("Invalid JSON");
          }
        });
      });

    // ================= ADMIN REGISTER =================
    if (req.method === "POST" && req.url === "/admin/register") {
      const data = await parseBody();
      const users = db.collection("users");

      if (await users.findOne({ email: data.email })) {
        res.writeHead(409, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "User already exists" }));
      }

      await users.insertOne({
        fullname: data.fullname,
        email: data.email,
        password: data.password,
        role: "Admin",
        createdAt: new Date(),
      });

      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Admin registered" }));
    }

    // ================= FRONTEND REGISTER =================
    else if (req.method === "POST" && req.url === "/api/register") {
      const data = await parseBody();
      const users = db.collection("users");

      if (await users.findOne({ email: data.email })) {
        res.writeHead(409, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "User already exists" }));
      }

      await users.insertOne({
        fullname: data.name,
        email: data.email,
        password: data.password,
        role: "user",
        createdAt: new Date(),
      });

      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Registration successful" }));
    }

    // ================= ADMIN LOGIN =================
    else if (req.method === "POST" && req.url === "/admin/login") {
      const { email, password } = await parseBody();
      const user = await db.collection("users").findOne({ email, password });

      if (!user) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Invalid credentials" }));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          fullname: user.fullname,
          email: user.email,
          role: user.role,
        })
      );
    }

    // ================= FRONTEND LOGIN =================
    else if (req.method === "POST" && req.url === "/api/login") {
      const { email, password } = await parseBody();
      const user = await db.collection("users").findOne({ email, password });

      if (!user) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Invalid credentials" }));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          message: "Login successful",
          user: {
            id: user._id,
            name: user.fullname,
            email: user.email,
            role: user.role,
          },
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
    // EDIT SUBJECT
    // ===================================================
    else if (
      req.method === "PUT" &&
      req.url.startsWith("/api/admin/subjects/")
    ) {
      const id = req.url.split("/")[4];
      const data = await parseBody();

      try {
        const result = await db.collection("subjects").updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              name: data.name.trim().toLowerCase(),
              description: data.description,
              updatedAt: new Date(),
            },
          }
        );

        if (result.matchedCount === 0) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "❌ Subject not found!" }));
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "✏️ Subject updated!" }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "⚠️ Invalid subject ID!" }));
      }
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
    // DELETE SUBJECT AND ALL ITS QUESTIONS
    // ===================================================
    else if (
      req.method === "DELETE" &&
      req.url.startsWith("/api/admin/questions/subject/")
    ) {
      const subjectId = req.url.split("/")[5];

      try {
        // 1️⃣ Validate subject exists
        const subject = await db
          .collection("subjects")
          .findOne({ _id: new ObjectId(subjectId) });

        if (!subject) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "❌ Subject not found!" }));
        }

        // 2️⃣ Delete all questions of subject
        const qResult = await db
          .collection("questions")
          .deleteMany({ subjectId });

        // 3️⃣ Delete subject itself
        await db
          .collection("subjects")
          .deleteOne({ _id: new ObjectId(subjectId) });

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            message: "🗑️ Subject & all questions deleted successfully",
            subject: subject.name,
            deletedQuestions: qResult.deletedCount,
          })
        );
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ message: "⚠️ Invalid subject ID format" })
        );
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
    // EDIT QUESTION
    // ===================================================
    else if (
      req.method === "PUT" &&
      req.url.startsWith("/api/admin/questions/")
    ) {
      const id = req.url.split("/")[3];
      const data = await parseBody();

      try {
        const result = await db.collection("questions").updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              question: data.question,
              options: data.options,
              correctAnswer: data.correctAnswer,
              subjectId: data.subjectId,
              updatedAt: new Date(),
            },
          }
        );

        if (result.matchedCount === 0) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "❌ Question not found!" }));
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "✏️ Question updated!" }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "⚠️ Invalid question ID!" }));
      }
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
    // IMPORT QUESTIONS
    // ===================================================
    else if (
      req.method === "POST" &&
      req.url === "/api/admin/questions/import"
    ) {
      upload.single("file")(req, res, async () => {
        try {
          // ===== 1. FILE CHECK =====
          if (!req.file) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "No file uploaded" }));
          }

          // ===== 2. PARSE JSON =====
          const jsonText = req.file.buffer.toString("utf8");
          const json = JSON.parse(jsonText);

          if (!json.category || !Array.isArray(json.questions)) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(
              JSON.stringify({
                message: "Invalid format: expected { category, questions[] }",
              })
            );
          }

          // ===== 3. SUBJECT HANDLING =====
          const subjectName = json.category.trim().toLowerCase();
          let subject = await db
            .collection("subjects")
            .findOne({ name: subjectName });

          if (!subject) {
            const sub = await db.collection("subjects").insertOne({
              name: subjectName,
              displayName: json.category.trim(),
              createdAt: new Date(),
            });
            subject = { _id: sub.insertedId };
          }

          // ===== 4. QUESTION IMPORT =====
          let duplicates = 0;
          const newQuestions = [];

          for (const q of json.questions) {
            const exists = await db.collection("questions").findOne({
              subjectId: subject._id.toString(),
              questionId: q.id,
            });

            if (exists) {
              duplicates++;
              continue;
            }

            newQuestions.push({
              subjectId: subject._id.toString(),
              questionId: q.id,
              language: q.language,
              type: q.type,
              title: q.title,
              code: q.code || null,
              options: q.options,
              correctAnswer: q.correctAnswer,
              createdAt: new Date(),
            });
          }

          // ===== 5. DUPLICATE CHECK =====
          if (!newQuestions.length) {
            res.writeHead(409, { "Content-Type": "application/json" });
            return res.end(
              JSON.stringify({
                message: "⚠️ All questions already exist",
                inserted: 0,
                duplicates,
              })
            );
          }

          // ===== 6. INSERT =====
          const result = await db
            .collection("questions")
            .insertMany(newQuestions);

          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              message: "📥 Questions imported successfully",
              inserted: result.insertedCount,
              duplicates,
              subject: json.category,
            })
          );
        } catch (err) {
          console.error("❌ Import Error:", err);
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Invalid JSON file" }));
        }
      });
    }

    // ===================================================
    // GET STATS
    // ===================================================
    else if (req.method === "GET" && req.url === "/api/admin/stats") {
      try {
        const subjectsCount = await db.collection("subjects").countDocuments();
        const questionsCount = await db
          .collection("questions")
          .countDocuments();
        const usersCount = await db
          .collection("users")
          .countDocuments({ role: "user" });
        const resultsCount = await db.collection("results").countDocuments();

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            subjects: subjectsCount,
            questions: questionsCount,
            users: usersCount,
            results: resultsCount,
          })
        );
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Failed to fetch stats" }));
      }
    }

    // ================= INVALID ROUTE =================
    else {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Route not found" }));
    }
  } catch (err) {
    console.error("❌ Server Error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal Server Error" }));
  }
});

server.listen(8081, () => {
  console.log("🚀 Server running at http://127.0.0.1:8081");
});
