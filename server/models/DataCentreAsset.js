const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  assetName: { type: String, required: true, trim: true },
  assetType: { type: String, required: true, enum: ['cctv_camera', 'server', 'switch', 'ups', 'ac', 'access_control'] },
  serviceTag: { type: String, trim: true },
  ipAddress: { type: String, trim: true },
  rackLocation: { type: String, trim: true },
  installDate: Date,
  warrantyExpiry: Date,
  status: { type: String, enum: ['active', 'maintenance', 'retired'], default: 'active' },
  location: { type: String, enum: ['islamabad', 'karachi'], required: true },
}, { timestamps: true });

module.exports = mongoose.model('DataCentreAsset', schema);
