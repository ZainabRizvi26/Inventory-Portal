const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  dataPort: { type: String, required: true, trim: true },
  voicePort: { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('PortMapping', schema);
