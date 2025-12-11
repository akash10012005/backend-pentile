const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // USER-xxxxx
  fullName: { type: String, required: true },
  phone: { type: String, unique: true, sparse: true }, // sparse: allows multiple nulls
  email: { type: String, unique: true, sparse: true },
  caste: { type: String },
  age: { type: Number, min: 1, max: 120 },
  maritalStatus: { type: String },
  gender: { type: String },
  annualIncome: { type: Number, min: 0 },
  password: { type: String, required: true },
}, { timestamps: true });

// Hash password before save if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const hash = await bcrypt.hash(this.password, SALT_ROUNDS);
    this.password = hash;
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
