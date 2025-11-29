const request = require('supertest');
const { ObjectId } = require('mongodb');
const { app, connectToMongoDB, closeMongoDB } = require('./app');

// MOCKS
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn().mockImplementation(async ({ idToken }) => {
      if (idToken === 'VALID_GOOGLE_TOKEN') {
        return {
          getPayload: () => ({
            email: 'testuser@example.com',
            name: 'Test User',
            picture: 'http://example.com/pic.jpg'
          })
        };
      }
      return null;
    })
  }))
}));

const mockDb = { users: [], events: [] };

const mockCollection = (collectionName) => ({
  createIndex: jest.fn(),
  findOne: jest.fn(async (query) => {
    const col = mockDb[collectionName];
    if (query._id) return col.find(d => d._id.toString() === query._id.toString()) || null;
    if (query.email) return col.find(d => d.email === query.email) || null;
    return null;
  }),
  find: jest.fn(() => ({
    sort: jest.fn(() => ({
      toArray: jest.fn(async () => [...mockDb[collectionName]])
    }))
  })),
  findOneAndUpdate: jest.fn(async (query, update, options) => {
    let doc = mockDb[collectionName].find(d => d.email === query.email);
    if (!doc && options.upsert) {
      doc = { _id: new ObjectId(), email: query.email, ...update.$setOnInsert, ...update.$set };
      mockDb[collectionName].push(doc);
    } else if (doc) {
      Object.assign(doc, update.$set);
    }
    return { value: doc };
  }),
  insertOne: jest.fn(async (doc) => {
    const newDoc = { ...doc, _id: new ObjectId() };
    mockDb[collectionName].push(newDoc);
    return { insertedId: newDoc._id };
  }),
  updateOne: jest.fn(async (query, update) => {
    const doc = mockDb[collectionName].find(d => d._id.toString() === query._id.toString());
    if (doc) {
      if (update.$addToSet) {
        const key = Object.keys(update.$addToSet)[0];
        const val = update.$addToSet[key];
        if (!doc[key]) doc[key] = [];
        if (!doc[key].includes(val)) doc[key].push(val);
      }
      if (update.$push) {
        const key = Object.keys(update.$push)[0];
        const val = update.$push[key];
        if (!doc[key]) doc[key] = [];
        doc[key].push(val);
      }
    }
    return { matchedCount: doc ? 1 : 0 };
  })
});

jest.mock('mongodb', () => {
  const actualMongo = jest.requireActual('mongodb');
  return {
    ...actualMongo,
    MongoClient: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(true),
      db: jest.fn(() => ({ collection: jest.fn((name) => mockCollection(name)) })),
      close: jest.fn()
    }))
  };
});

describe('API Integration Flow', () => {
  let authCookie;
  let userId;
  let eventId;

  beforeAll(async () => await connectToMongoDB());
  afterAll(async () => await closeMongoDB());

  test('POST /api/auth/google (Login)', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ token: 'VALID_GOOGLE_TOKEN' });
    
    expect(res.statusCode).toBe(200);
    userId = res.body._id;
    authCookie = res.headers['set-cookie'][0];
  });

  test('GET /api/auth/me (Session Check)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie);
    
    expect(res.statusCode).toBe(200);//200 means successful
    expect(res.body.email).toBe('testuser@example.com');
  });

  test('GET /api/events (Initial Fetch)', async () => {
    const res = await request(app).get('/api/events');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('POST /api/events (Create Event)', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Cookie', authCookie)
      .send({
        title: "Test Event",
        date: "2023-12-25",
        time: "10:00",
        location: "Test Loc",
        category: "Social",
        description: "Desc",
        creatorId: userId,
        image: ""
      });

    expect(res.statusCode).toBe(201);
    eventId = res.body.eventId;
  });

  test('POST /api/events/join (Join Event)', async () => {
    const res = await request(app)
      .post('/api/events/join')
      .set('Cookie', authCookie)
      .send({ eventId });

    expect(res.statusCode).toBe(200);
  });

  test('POST /api/events/comment (Add Comment)', async () => {
    const res = await request(app)
      .post('/api/events/comment')
      .set('Cookie', authCookie)
      .send({ eventId, text: "Nice event!" });

    expect(res.statusCode).toBe(200);
  });

  test('GET /api/events (Verify Data Persistence)', async () => {
    const res = await request(app).get('/api/events');
    const event = res.body.find(e => e._id === eventId);
    
    expect(event.attendees).toContain(userId);
    expect(event.comments[0].text).toBe("Nice event!");
  });
});