require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const cors = require('cors');

const app = express();
const client = new MongoClient(process.env.DATABASE_URL || "mongodb://localhost:27017");
const gClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
let db;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Helper: Verify Google Token
const verifyToken = async (token) => (await gClient.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID })).getPayload();

// Routes
app.post('/api/auth/google', async (req, res) => {
    try {
        const payload = await verifyToken(req.body.token);
        const { value } = await db.collection('users').findOneAndUpdate(
            { email: payload.email },
            { $set: { name: payload.name, picture: payload.picture, lastLogin: new Date() }, $setOnInsert: { joinedEvents: [], createdAt: new Date() } },
            { upsert: true, returnDocument: 'after' }
        );
        res.json(value);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/events', async (req, res) => {
    const events = await db.collection('events').find({}).sort({ date: 1 }).toArray();
    res.json(events);
});

app.post('/api/events', async (req, res) => {
    try {
        const { title, date, creatorId, image } = req.body;
        if (!title || !date || !creatorId) return res.status(400).json({ error: "Missing fields" });
        
        const newEvent = { ...req.body, image: image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87", attendees: [], comments: [], createdAt: new Date() };
        const result = await db.collection('events').insertOne(newEvent);
        res.status(201).json({ success: true, eventId: result.insertedId });
    } catch (e) { res.status(500).json({ error: "Creation failed" }); }
});

app.post('/api/events/join', async (req, res) => {
    try {
        await db.collection('events').updateOne({ _id: new ObjectId(req.body.eventId) }, { $addToSet: { attendees: req.body.userId } });
        await db.collection('users').updateOne({ _id: new ObjectId(req.body.userId) }, { $addToSet: { joinedEvents: req.body.eventId } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Join failed" }); }
});

app.post('/api/events/comment', async (req, res) => {
    try {
        const { eventId, userId, userName, text } = req.body;
        await db.collection('events').updateOne({ _id: new ObjectId(eventId) }, { $push: { comments: { userId, userName, text, timestamp: new Date() } } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Comment failed" }); }
});

// SPA Fallback
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

// Start Server
client.connect().then(() => {
    db = client.db("clubspot");
    db.collection("users").createIndex({ email: 1 }, { unique: true });
    app.listen(process.env.PORT || 3000, () => console.log(`Server running on port ${process.env.PORT || 3000}`));
}).catch(console.error);