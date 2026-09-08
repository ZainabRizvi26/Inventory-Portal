const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const schema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true }, email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, unique: true, sparse: true, trim: true }, password: { type: String, required: true, minlength: 8 },
  phone: String, cnic: String, dob: Date, department: String, designation: String, location: { type: String, enum: ['islamabad', 'karachi'], required: true }, role: { type: String, enum: ['user', 'admin'], default: 'user' }, lastSeen: Date
}, { timestamps: true });
schema.pre('save', async function () { if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12); });
schema.methods.comparePassword = function (password) { return bcrypt.compare(password, this.password); };
module.exports = mongoose.model('User', schema);
