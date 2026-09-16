require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const accessoryRoutes = require('./routes/accessories');
const portMappingRoutes = require('./routes/portMappings');
const dataCentreRoutes = require('./routes/dataCentreAssets');
const usersRoutes = require('./routes/users');
const adminCodeRoutes = require('./routes/adminCode');

if (!process.env.JWT_SECRET || !process.env.MONGODB_URI) {
  console.error('Missing required environment variables: JWT_SECRET and MONGODB_URI must both be set. Check your .env file.');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/db-viewer/collections', async (_req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const withCounts = await Promise.all(
      collections.map(async (c) => ({ name: c.name, count: await mongoose.connection.db.collection(c.name).countDocuments() }))
    );
    withCounts.sort((a, b) => a.name.localeCompare(b.name));
    res.json({ collections: withCounts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.get('/api/db-viewer/collections/:name', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = 50;
    const collection = mongoose.connection.db.collection(req.params.name);
    const total = await collection.countDocuments();
    const docs = await collection.find({}).skip((page - 1) * pageSize).limit(pageSize).toArray();
    res.json({ total, page, pageSize, docs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/accessories', accessoryRoutes);
app.use('/api/port-mappings', portMappingRoutes);
app.use('/api/data-centre-assets', dataCentreRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin-code', adminCodeRoutes);
const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI).then(() => app.listen(port, () => console.log(`Inventory Portal running at http://localhost:${port}`))).catch((err) => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
