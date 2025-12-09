const Subject = require('../models/Subject');
const Question = require('../models/Question');
const User = require('../models/User');
const Result = require('../models/Result');

// =========================
// SUBJECTS
// =========================

// CREATE SUBJECT
exports.createSubject = async (req, res, next) => {
  try {
    let { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Subject name is required' });
    }

    // Normalize (remove spaces + lowercase)
    name = name.trim();

    // Check duplicate (case-insensitive)
    const existing = await Subject.findOne({
      name: { $regex: '^' + name + '$', $options: 'i' }
    });

    if (existing) {
      return res.status(409).json({ message: 'Subject already exists' });
    }

    const s = new Subject({ name, description });
    await s.save();

    return res.status(201).json({ ok: true, subject: s });

  } catch (err) {
    next(err);
  }
};

// GET ALL SUBJECTS
exports.getSubjects = async (req, res, next) => {
  try {
    const list = await Subject.find({}).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
};

// DELETE SUBJECT + DELETE ALL RELATED QUESTIONS
exports.deleteSubject = async (req, res, next) => {
  try {
    const id = req.params.id;

    await Question.deleteMany({ subjectId: id });
    await Subject.findByIdAndDelete(id);

    return res.json({ ok: true, message: 'Subject deleted' });
  } catch (err) {
    next(err);
  }
};

// =========================
// QUESTIONS
// =========================

// CREATE QUESTION
exports.createQuestion = async (req, res, next) => {
  try {
    const { subjectId, q, options, answerIndex } = req.body;

    if (!subjectId || !q || !Array.isArray(options) || typeof answerIndex !== 'number') {
      return res.status(400).json({ message: 'subjectId, q, options[], answerIndex required' });
    }

    // Optional: Prevent duplicate question in same subject
    const existing = await Question.findOne({
      subjectId,
      q: { $regex: '^' + q.trim() + '$', $options: 'i' }
    });

    if (existing) {
      return res.status(409).json({ message: 'Question already exists in this subject' });
    }

    const question = new Question({
      subjectId,
      q: q.trim(),
      options,
      answerIndex
    });

    await question.save();

    return res.status(201).json({ ok: true, question });

  } catch (err) {
    next(err);
  }
};

// GET ALL QUESTIONS
exports.getQuestions = async (req, res, next) => {
  try {
    const list = await Question.find({}).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
};

// GET QUESTIONS BY SUBJECT
exports.getQuestionsBySubject = async (req, res, next) => {
  try {
    const subjectId = req.params.subjectId;
    const list = await Question.find({ subjectId }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
};

// DELETE QUESTION
exports.deleteQuestion = async (req, res, next) => {
  try {
    const id = req.params.id;
    await Question.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// =========================
// STATS (Dashboard)
// =========================
exports.stats = async (req, res, next) => {
  try {
    const subjects = await Subject.countDocuments();
    const questions = await Question.countDocuments();
    const users = await User.countDocuments();
    const results = await Result.countDocuments();

    res.json({ subjects, questions, users, results });

  } catch (err) {
    next(err);
  }
};
