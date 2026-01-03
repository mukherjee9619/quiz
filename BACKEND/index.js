require("dotenv").config();
const http = require("http");
const { MongoClient, ObjectId } = require("mongodb");
const multer = require("multer");
const upload = multer();
const crypto = require("crypto");
const { sendOTPEmail } = require("./middleware/mailer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const logActivity = require("./utils/activityLogger");
const ACTIVITY = require("./utils/activityTypes");


// ================= CONFIG =================
const OTP_EXPIRY_SECONDS = 50 * 1000;
const MAX_OTP_ATTEMPTS = 5;
// ================= UTILS =================
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

function hashOTP(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}
// ===== MongoDB connection =====

// const url = "mongodb://127.0.0.1:27017";
const url = "mongodb+srv://KillerTuri:nLfnCZdP1wSCtTDj@cluster0.ytyq8p5.mongodb.net/";
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

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const result = await users.insertOne({
        fullname: data.fullname,
        email: data.email,
        password: hashedPassword,
        role: "Admin",
        createdAt: new Date(),
      });

      // 🔔 ACTIVITY LOG
      logActivity(db, {
        actorType: "ADMIN",
        actorId: result.insertedId,
        action: ACTIVITY.ADMIN.REGISTERED,
        entityType: "ADMIN",
        entityId: result.insertedId,
        message: "New admin registered",
        metadata: { email: data.email }
      });

      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Admin registered" }));
    }

    // ================= USER REGISTER =================
    else if (req.method === "POST" && req.url === "/api/register") {
      const data = await parseBody();
      const users = db.collection("users");

      if (await users.findOne({ email: data.email })) {
        res.writeHead(409, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "User already exists" }));
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const result = await users.insertOne({
        fullname: data.name,
        email: data.email,
        password: hashedPassword,
        role: "user",
        createdAt: new Date(),
      });

      // 🔔 ACTIVITY LOG
      logActivity(db, {
        actorType: "USER",
        actorId: result.insertedId,
        action: ACTIVITY.USER.REGISTERED,
        entityType: "USER",
        entityId: result.insertedId,
        message: "New user registered",
        metadata: { email: data.email }
      });

      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Registration successful" }));
    }

    // ================= ADMIN LOGIN =================
    else if (req.method === "POST" && req.url === "/admin/login") {
      const { email, password } = await parseBody();
      const user = await db.collection("users").findOne({ email });

      if (!user) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Invalid credentials" }));
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Invalid credentials" }));
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      // 🔔 ACTIVITY LOG
      logActivity(db, {
        actorType: "ADMIN",
        actorId: user._id,
        action: ACTIVITY.ADMIN.LOGIN,
        entityType: "ADMIN",
        entityId: user._id,
        message: "Admin logged in",
        metadata: { email: user.email }
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          token,
          admin: {
            fullname: user.fullname,
            email: user.email,
            role: user.role,
          },
        })
      );
    }

    // ================= FORGOT PASSWORD (SEND OTP) =================
    else if (req.method === "POST" && req.url === "/api/auth/forgot-password") {
      const { email } = await parseBody();
      const users = db.collection("users");

      const user = await users.findOne({ email });
      if (!user) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Email not registered" }));
      }

      const otp = generateOTP();

      await users.updateOne(
        { email },
        {
          $set: {
            otpHash: hashOTP(otp),
            otpExpires: Date.now() + OTP_EXPIRY_SECONDS,
            otpAttempts: 0,
            otpVerified: false,
          },
        }
      );

      await sendOTPEmail(email, otp);

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "OTP sent to email" }));
    }

    // ================= VERIFY OTP =================
    else if (req.method === "POST" && req.url === "/api/auth/verify-otp") {
      const { email, otp } = await parseBody();
      const users = db.collection("users");

      const user = await users.findOne({ email });

      if (!user || !user.otpHash) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Invalid request" }));
      }

      if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
        res.writeHead(429, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Too many attempts" }));
      }

      if (Date.now() > user.otpExpires) {
        res.writeHead(410, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "OTP expired" }));
      }

      if (hashOTP(otp) !== user.otpHash) {
        await users.updateOne({ email }, { $inc: { otpAttempts: 1 } });

        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Invalid OTP" }));
      }

      // ✅ OTP SUCCESS → GENERATE RESET TOKEN
      const resetToken = jwt.sign(
        { email, purpose: "reset-password" },
        process.env.MAIL_PASS,
        { expiresIn: "5m" }
      );

      // 🔥 CLEAR OTP DATA (VERY IMPORTANT)
      await users.updateOne(
        { email },
        {
          $unset: {
            otpHash: "",
            otpExpires: "",
            otpAttempts: "",
          },
        }
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          message: "OTP verified",
          resetToken,
        })
      );
    }

    // ================= RESET PASSWORD =================
    else if (req.method === "POST" && req.url === "/api/auth/reset-password") {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Unauthorized" }));
      }

      const token = authHeader.split(" ")[1];

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.MAIL_PASS);
      } catch {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Token expired or invalid" }));
      }

      if (decoded.purpose !== "reset-password") {
        res.writeHead(403, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Invalid token usage" }));
      }

      const { newPassword } = await parseBody();
      const users = db.collection("users");

      // ⚠️ HASH PASSWORD (IMPORTANT)
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await users.updateOne(
        { email: decoded.email },
        {
          $set: { password: hashedPassword },
        }
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Password reset successful" }));
    }

    // ================= FRONTEND LOGIN =================
    else if (req.method === "POST" && req.url === "/api/login") {
      const { email, password } = await parseBody();

      const user = await db.collection("users").findOne({ email });

      if (!user) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Invalid credentials" }));
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Invalid credentials" }));
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      // 🔔 ACTIVITY LOG
      logActivity(db, {
        actorType: "USER",
        actorId: user._id,
        action: ACTIVITY.USER.LOGIN,
        entityType: "USER",
        entityId: user._id,
        message: "User logged in",
        metadata: {
          email: user.email,
        },
      });

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
          token,
        })
      );
    }


    // ===================================================
    // ADD SUBJECT
    // ===================================================
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

      // 🔔 ACTIVITY LOG
      logActivity(db, {
        actorType: "ADMIN",
        action: ACTIVITY.SUBJECT.CREATED,
        entityType: "SUBJECT",
        entityId: result.insertedId,
        message: `Subject "${data.name}" created`,
        metadata: {
          subjectId: result.insertedId,
          name: data.name,
        },
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
    // ===================================================
    // EDIT SUBJECT
    // ===================================================
    else if (
      req.method === "PUT" &&
      req.url.startsWith("/api/admin/subjects/")
    ) {
      const id = req.url.split("/")[4];
      const data = await parseBody();

      if (!data.name || !data.name.trim()) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Subject name is required" }));
      }

      try {
        const result = await db.collection("subjects").updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              name: data.name.trim(),
              description: data.description?.trim() || "",
              updatedAt: new Date(),
            },
          }
        );

        if (result.matchedCount === 0) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Subject not found" }));
        }

        // 🔔 ACTIVITY LOG
        logActivity(db, {
          actorType: "ADMIN",
          action: ACTIVITY.SUBJECT.UPDATED,
          entityType: "SUBJECT",
          entityId: new ObjectId(id),
          message: `Subject updated: ${data.name}`,
          metadata: {
            subjectId: id,
            name: data.name,
          },
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Subject updated" }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Invalid subject ID" }));
      }
    }

    // ===================================================
    // GET SINGLE SUBJECT
    // ===================================================
    else if (
      req.method === "GET" &&
      req.url.startsWith("/api/admin/subjects/") &&
      req.url.split("/").length === 5
    ) {
      try {
        const id = req.url.split("/")[4];

        const subject = await db
          .collection("subjects")
          .findOne({ _id: new ObjectId(id) });

        if (!subject) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Subject not found" }));
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(subject));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Invalid subject ID" }));
      }
    }

    // ===================================================
    // GET ALL SUBJECTS
    // ===================================================
    else if (
      req.method === "GET" &&
      req.url.startsWith("/api/admin/subjects")
    ) {
      try {
        const urlObj = new URL(req.url, `http://${req.headers.host}`);

        const page = parseInt(urlObj.searchParams.get("page")) || 1;
        const limitParam = urlObj.searchParams.get("limit");
        const search = urlObj.searchParams.get("search") || "";

        // 🔹 limit logic
        // limit = null → ALL
        // limit = 0 → ALL
        // limit > 0 → pagination
        const limit = limitParam === null ? null : parseInt(limitParam);

        const query = search ? { name: { $regex: search, $options: "i" } } : {};

        const collection = db.collection("subjects");

        const total = await collection.countDocuments(query);

        let cursor = collection.find(query).sort({ createdAt: -1 });

        // 🔹 Apply pagination ONLY when limit is valid (>0)
        if (limit && limit > 0) {
          cursor = cursor.skip((page - 1) * limit).limit(limit);
        }

        const subjects = await cursor.toArray();

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            subjects,
            totalSubjects: total,

            // 🔹 pagination meta only when paginated
            totalPages: limit && limit > 0 ? Math.ceil(total / limit) : 1,

            currentPage: limit && limit > 0 ? page : 1,

            limit: limit && limit > 0 ? limit : "ALL",
          })
        );
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Server error" }));
      }
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
        const subject = await db
          .collection("subjects")
          .findOne({ _id: new ObjectId(id) });

        if (!subject) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "❌ Subject not found!" }));
        }

        await db.collection("subjects").deleteOne({ _id: new ObjectId(id) });

        const qResult = await db
          .collection("questions")
          .deleteMany({ subjectId: id });

        // 🔔 ACTIVITY LOG
        logActivity(db, {
          actorType: "ADMIN",
          action: ACTIVITY.SUBJECT.DELETED,
          entityType: "SUBJECT",
          entityId: new ObjectId(id),
          message: `Subject deleted: ${subject.name}`,
          metadata: {
            subjectId: id,
            deletedQuestions: qResult.deletedCount,
          },
        });

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
        const subject = await db
          .collection("subjects")
          .findOne({ _id: new ObjectId(subjectId) });

        if (!subject) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "❌ Subject not found!" }));
        }

        const qResult = await db
          .collection("questions")
          .deleteMany({ subjectId });

        await db
          .collection("subjects")
          .deleteOne({ _id: new ObjectId(subjectId) });

        // 🔔 ACTIVITY LOG
        logActivity(db, {
          actorType: "ADMIN",
          action: ACTIVITY.SUBJECT.DELETED,
          entityType: "SUBJECT",
          entityId: new ObjectId(subjectId),
          message: `Subject & all questions deleted: ${subject.name}`,
          metadata: {
            subjectId,
            deletedQuestions: qResult.deletedCount,
          },
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            message: `🗑️ Subject & all questions deleted successfully`,
            subject: subject.name,
            deletedQuestions: qResult.deletedCount,
          })
        );
      } catch {
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

      // 🔔 ACTIVITY LOG
      logActivity(db, {
        actorType: "ADMIN",
        action: ACTIVITY.QUESTION.ADDED,
        entityType: "QUESTION",
        entityId: result.insertedId,
        message: "New question added",
        metadata: {
          subjectId: data.subjectId,
          questionId: result.insertedId,
        },
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
      req.url.match(/^\/api\/admin\/questions\/[a-f\d]{24}$/)
    ) {
      const id = req.url.split("/")[4];
      const data = await parseBody();

      try {
        const result = await db.collection("questions").updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              subjectId: data.subjectId,
              question: data.question,
              options: data.options,
              correctAnswer: Number(data.correctAnswer),
              updatedAt: new Date(),
            },
          }
        );

        if (result.matchedCount === 0) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Question not found" }));
        }

        // 🔔 ACTIVITY LOG
        logActivity(db, {
          actorType: "ADMIN",
          action: ACTIVITY.QUESTION.UPDATED,
          entityType: "QUESTION",
          entityId: new ObjectId(id),
          message: "Question updated",
          metadata: {
            questionId: id,
            subjectId: data.subjectId,
          },
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Question updated" }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Update failed" }));
      }
    }


    // ===================================================
    // GET SINGLE QUESTION
    // ===================================================
    else if (
      req.method === "GET" &&
      /^\/api\/admin\/questions\/[a-f\d]{24}(\?.*)?$/.test(req.url)
    ) {
      try {
        const id = req.url.split("/").pop().split("?")[0];

        const question = await db.collection("questions").findOne({
          _id: new ObjectId(id),
        });

        if (!question) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Question not found" }));
        }

        const subject = await db.collection("subjects").findOne({
          _id: new ObjectId(question.subjectId),
        });

        res.writeHead(200, {
          "Content-Type": "application/json",
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        });

        return res.end(
          JSON.stringify({
            _id: question._id.toString(),
            subjectId: question.subjectId.toString(),
            question: question.title,
            options: question.options,
            correctAnswer: question.correctAnswer,
            subjectName: subject?.displayName || subject?.name || "Unknown",
          })
        );
      } catch (err) {
        console.error(err);
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Invalid Question ID" }));
      }
    }

    // ===================================================
    // GET QUESTIONS (Pagination + Search + Subject Filter)
    // ===================================================
    else if (
      req.method === "GET" &&
      req.url.startsWith("/api/admin/questions")
    ) {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);

      const page = parseInt(urlObj.searchParams.get("page")) || 1;
      const limitParam = urlObj.searchParams.get("limit") || "10";
      const search = urlObj.searchParams.get("search") || "";
      const subjectId = urlObj.searchParams.get("subjectId");

      const query = {};

      if (search) {
        query.title = { $regex: search, $options: "i" };
      }

      if (subjectId && subjectId !== "all") {
        query.subjectId = subjectId;
      }

      const subjects = await db.collection("subjects").find({}).toArray();
      const subjectMap = {};
      subjects.forEach(
        (s) => (subjectMap[s._id.toString()] = s.displayName || s.name)
      );

      const total = await db.collection("questions").countDocuments(query);

      let questionsQuery = db
        .collection("questions")
        .find(query)
        .sort({ createdAt: -1 });

      let questions;

      if (limitParam === "all") {
        questions = await questionsQuery.toArray();
      } else {
        const limit = parseInt(limitParam);
        questions = await questionsQuery
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray();
      }

      const final = questions.map((q) => ({
        ...q,
        subjectName: subjectMap[q.subjectId] || "Unknown",
      }));

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          questions: final,
          total,
          totalPages:
            limitParam === "all" ? 1 : Math.ceil(total / parseInt(limitParam)),
          currentPage: page,
        })
      );
    }
    //FRONTEND ALL QUESTIONS API //
    else if (req.method === "GET" && req.url.startsWith("/api/questions")) {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);

      const search = urlObj.searchParams.get("search") || "";
      const subjectId = urlObj.searchParams.get("subjectId");

      const query = {};

      // 🔍 Search by title
      if (search) {
        query.title = { $regex: search, $options: "i" };
      }

      // 🎯 Filter by subject
      if (subjectId && subjectId !== "all") {
        query.subjectId = subjectId;
      }

      // 📘 Load subjects
      const subjects = await db.collection("subjects").find({}).toArray();
      const subjectMap = {};
      subjects.forEach(
        (s) => (subjectMap[s._id.toString()] = s.displayName || s.name)
      );

      // ❌ NO PAGINATION
      const questions = await db
        .collection("questions")
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      const final = questions.map((q) => ({
        ...q,
        subjectName: subjectMap[q.subjectId] || "Unknown",
      }));

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          questions: final,
          total: final.length,
        })
      );
    }

    // ===================================================
    // DELETE SINGLE QUESTION
    // ===================================================
    else if (
      req.method === "DELETE" &&
      req.url.startsWith("/api/admin/questions/") &&
      req.url.split("/").length === 5
    ) {
      try {
        const id = req.url.split("/")[4];

        if (!ObjectId.isValid(id)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "⚠️ Invalid question ID!" }));
        }

        const question = await db
          .collection("questions")
          .findOne({ _id: new ObjectId(id) });

        if (!question) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "❌ Question not found!" }));
        }

        await db
          .collection("questions")
          .deleteOne({ _id: new ObjectId(id) });

        // 🔔 ACTIVITY LOG
        logActivity(db, {
          actorType: "ADMIN",
          action: ACTIVITY.QUESTION.DELETED,
          entityType: "QUESTION",
          entityId: new ObjectId(id),
          message: "Question deleted",
          metadata: {
            questionId: id,
            subjectId: question.subjectId,
          },
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ message: "🗑️ Question deleted successfully!" })
        );
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Server error" }));
      }
    }

    // ===================================================
    // DELETE QUESTION ALL (fallback)
    // ===================================================
    else if (
      req.method === "DELETE" &&
      req.url.startsWith("/api/admin/questions/")
    ) {
      const id = req.url.split("/")[3];

      try {
        const question = await db
          .collection("questions")
          .findOne({ _id: new ObjectId(id) });

        if (!question) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "❌ Question not found!" }));
        }

        await db
          .collection("questions")
          .deleteOne({ _id: new ObjectId(id) });

        // 🔔 ACTIVITY LOG
        logActivity(db, {
          actorType: "ADMIN",
          action: ACTIVITY.QUESTION.DELETED,
          entityType: "QUESTION",
          entityId: new ObjectId(id),
          message: "Question deleted",
          metadata: {
            questionId: id,
            subjectId: question.subjectId,
          },
        });

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
          if (!req.file) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "No file uploaded" }));
          }

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

          const result = await db
            .collection("questions")
            .insertMany(newQuestions);

          // 🔔 ACTIVITY LOG (BULK)
          logActivity(db, {
            actorType: "ADMIN",
            action: ACTIVITY.QUESTION.BULK_UPLOAD,
            entityType: "QUESTION",
            message: "Questions imported via JSON",
            metadata: {
              subject: json.category,
              inserted: result.insertedCount,
              duplicates,
            },
          });

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

    // ================= GET ADMIN ACTIVITIES =================
    else if (req.method === "GET" && req.url.startsWith("/admin/activities")) {

      const activities = await db
        .collection("activities")
        .find({})
        .sort({ createdAt: -1 })
        .limit(30)
        .toArray();

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(activities));
    }


    // ================= MARK ACTIVITY READ =================
    else if (req.method === "PUT" && req.url === "/admin/activities/read") {

      await db.collection("activities").updateMany(
        { read: false },
        { $set: { read: true } }
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "All notifications marked as read" }));
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
