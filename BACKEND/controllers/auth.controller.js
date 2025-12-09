const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');

const SALT_ROUNDS = 10;

exports.register = async (req, res, next) => {
  try {
    const { fullname, email, password, phone } = req.body;
    if (!fullname || !email || !password) return res.status(400).json({ message: 'fullname, email, password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'User already exists' });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new User({ fullname, email, phone, password: hash, role: 'student' });
    await user.save();

    return res.status(201).json({ message: 'Registration successful', userId: user._id });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email & password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

    return res.json({ message: 'Login successful', token, user: { id: user._id, fullname: user.fullname, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};
