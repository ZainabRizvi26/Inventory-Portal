const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'admin-signup-code' },
  code: { type: String, required: true },
}, { timestamps: true });
module.exports = mongoose.model('AdminCode', schema);
