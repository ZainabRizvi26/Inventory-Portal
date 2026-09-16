require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const email = process.env.SEED_ADMIN_EMAIL || 'admin@inventoryportal.local';
const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
const location = process.env.SEED_ADMIN_LOCATION || 'islamabad';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    existing.isSuperAdmin = true;
    if (process.env.SEED_ADMIN_PASSWORD) existing.password = password;
    await existing.save();
    console.log(`Updated existing user "${email}" to role admin (super admin).`);
  } else {
    await User.create({ fullName: 'Admin User', email, password, location, role: 'admin', isSuperAdmin: true });
    console.log(`Created super admin account: ${email} / ${password}`);
  }
  await mongoose.disconnect();
});
