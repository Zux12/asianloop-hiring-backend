const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, index: true, required: true },
    role: { type: String, enum: ['admin', 'interviewer'], required: true },
    passwordHash: { type: String, required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

UserSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};

UserSchema.methods.validatePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);
