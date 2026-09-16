require('dotenv').config();
const mongoose = require('mongoose');
const AdminCode = require('./models/AdminCode');

const code = process.env.SEED_ADMIN_CODE || 'RS-ADMIN-2025';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const existing = await AdminCode.findOne({ key: 'admin-signup-code' });
  if (existing) {
    existing.code = code;
    await existing.save();
    console.log(`Updated admin signup code to: ${code}`);
  } else {
    await AdminCode.create({ key: 'admin-signup-code', code });
    console.log(`Created admin signup code: ${code}`);
  }
  await mongoose.disconnect();
});
