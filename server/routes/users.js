const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Course = require('../models/Course');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, userId: user._id, role: user.role });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/enrolled-courses', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.userId).populate('enrolledCourses');
      res.json(user.enrolledCourses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;