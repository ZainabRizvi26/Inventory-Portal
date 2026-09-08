const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const authRoutes = require('./auth');

process.env.JWT_SECRET = 'test-secret';

const app = require('express')();
app.use(require('express').json());
app.use('/api/auth', authRoutes);

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

const validUser = {
  fullName: 'Zainab Rizvi',
  email: 'zainab@example.com',
  username: 'zainab',
  password: 'sup3rSecret!',
  location: 'islamabad',
};

async function registerUser(body = validUser) {
  const res = await request(app).post('/api/auth/register').send(body);
  return res;
}

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token', async () => {
    const res = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.fullName).toBe('Zainab Rizvi');
    expect(res.body.user.role).toBe('user');
  });

  it('rejects duplicate email with 409', async () => {
    await registerUser();
    const res = await registerUser({ ...validUser, username: 'someoneelse' });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('rejects duplicate username with 409', async () => {
    await registerUser();
    const res = await registerUser({ ...validUser, email: 'other@example.com' });
    expect(res.status).toBe(409);
  });

  it('rejects missing email or password with 400', async () => {
    const res = await registerUser({ ...validUser, email: undefined });
    expect(res.status).toBe(400);
  });

  it('does not allow role to be set from request body', async () => {
    const res = await registerUser({ ...validUser, role: 'admin' });
    expect(res.body.user.role).toBe('user');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await registerUser();
  });

  it('logs in with email and returns a token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      identifier: 'zainab@example.com',
      password: 'sup3rSecret!',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBeUndefined();
  });

  it('logs in with username', async () => {
    const res = await request(app).post('/api/auth/login').send({
      identifier: 'zainab',
      password: 'sup3rSecret!',
    });
    expect(res.status).toBe(200);
  });

  it('rejects wrong password with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      identifier: 'zainab@example.com',
      password: 'wrong-password',
    });
    expect(res.status).toBe(401);
  });

  it('rejects unknown identifier with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      identifier: 'nobody@example.com',
      password: 'sup3rSecret!',
    });
    expect(res.status).toBe(401);
  });

  it('rejects role mismatch with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      identifier: 'zainab@example.com',
      password: 'sup3rSecret!',
      role: 'admin',
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 when identifier is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'sup3rSecret!' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ identifier: 'zainab' });
    expect(res.status).toBe(400);
  });
});
