const jwt = require('jsonwebtoken');
const { customAlphabet } = require('nanoid');
const User = require('../models/User');

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6); // 6 chars

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  console.error('JWT_SECRET not set in .env');
  // We don't exit here so Codespace can run for dev, but set before production.
}

function generateUserId() {
  return `USER-${nanoid()}`;
}

function generateToken(user) {
  const payload = { id: user._id, userId: user.userId };
  return jwt.sign(payload, JWT_SECRET || 'dev-secret', { expiresIn: JWT_EXPIRES_IN });
}

exports.register = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      caste,
      age,
      maritalStatus,
      gender,
      annualIncome,
      password,
    } = req.body;

    if (!fullName || !password) {
      return res.status(400).json({ error: 'fullName and password are required' });
    }

    if (!email && !phone) {
      return res.status(400).json({ error: 'Either email or phone is required' });
    }

    // uniqueness checks
    if (email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ error: 'Email already in use' });
    }
    if (phone) {
      const existingP = await User.findOne({ phone });
      if (existingP) return res.status(409).json({ error: 'Phone already in use' });
    }

    const user = new User({
      userId: generateUserId(),
      fullName,
      phone,
      email,
      caste,
      age,
      maritalStatus,
      gender,
      annualIncome,
      password,
    });

    await user.save();

    const token = generateToken(user);

    return res.status(201).json({
      message: 'User registered',
      userId: user.userId,
      token,
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    if (!password || (!email && !phone)) {
      return res.status(400).json({ error: 'Provide password and email or phone' });
    }

    const user = email ? await User.findOne({ email }) : await User.findOne({ phone });

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);

    return res.json({
      message: 'Login successful',
      token,
      userId: user.userId,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
