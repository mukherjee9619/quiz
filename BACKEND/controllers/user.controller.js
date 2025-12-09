const Result = require('../models/Result');
const Question = require('../models/Question');

// Save quiz result (students call this)
exports.submitResult = async (req, res, next) => {
  try {
    const { userId, userName, subjectId, total, correct, timeTakenSec } = req.body;
    if (typeof total !== 'number' || typeof correct !== 'number') return res.status(400).json({ message: 'total & correct required' });

    const r = new Result({ userId, userName, subjectId, total, correct, timeTakenSec });
    await r.save();
    return res.status(201).json({ ok: true, result: r });
  } catch (err) { next(err); }
};

// Get user results
exports.getUserResults = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const list = await Result.find({ userId }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { next(err); }
};
