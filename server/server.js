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

if (!process.env.JWT_SECRET || !process.env.MONGODB_URI) {
  console.error('Missing required environment variables: JWT_SECRET and MONGODB_URI must both be set. Check your .env file.');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/accessories', accessoryRoutes);
app.use('/api/port-mappings', portMappingRoutes);
app.use('/api/data-centre-assets', dataCentreRoutes);
app.use('/api/users', usersRoutes);
const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI).then(() => app.listen(port, () => console.log(`API listening on ${port}`))).catch((err) => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
