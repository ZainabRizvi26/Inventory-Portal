const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  srfNo: Number,
  deviceName: { type: String, required: true, trim: true },
  displayName: { type: String, trim: true },
  deviceType: { type: String, required: true, enum: ['laptop', 'lcd', 'keyboard_mouse', 'docking_station', 'printer', 'network_printer'] },
  serviceTag: { type: String, trim: true },
  shipTag: { type: String, trim: true },
  shipDate: Date,
  expiryDate: Date,
  username: { type: String, trim: true },
  customAccMainU: { type: String, trim: true },
  status: { type: String, enum: ['available', 'assigned', 'maintenance', 'retired'], default: 'available' },
  location: { type: String, enum: ['islamabad', 'karachi'], required: true },
}, { timestamps: true });

module.exports = mongoose.model('Accessory', schema);
