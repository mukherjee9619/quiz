const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller');
const userCtrl = require('../controllers/user.controller');

// public
router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);

// student submits result
router.post('/api/result', userCtrl.submitResult);

// view user results
router.get('/api/results/:userId', userCtrl.getUserResults);

module.exports = router;
