const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || "default_test_secret"; // Fallback for testing

// --- MongoDB Setup ---
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const dbUrl = process.env.DATABASE_URL || "mongodb://localhost:27017";
const DATABASE_NAME = "clubspot";

// --- Google Auth Setup ---
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE";
const g_client = new OAuth2Client(GOOGLE_CLIENT_ID);

// --- App Configuration ---
const app = express();

// --- Middleware ---
app.use(cors()); 
app.use(express.json()); 
app.use(cookieParser());

// Serve static files from 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));


const client = new MongoClient(dbUrl, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db;
let usersCollection;
let eventsCollection;

// Exported connection function
async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB successfully!");
        
        db = client.db(DATABASE_NAME);
        usersCollection = db.collection("users");
        eventsCollection = db.collection("events");
        
        // Indexes
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        return true;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        return false;
    }
}

// Function to close connection (useful for tests)
async function closeMongoDB() {
    await client.close();
}

async function verifyGoogleToken(token) {
    const ticket = await g_client.verifyIdToken({
         idToken: token,
         audience: GOOGLE_CLIENT_ID,  
    });
    return ticket.getPayload();
}

const authenticateJWT = (req, res, next) => {
    const token = req.cookies.auth_token;
    if (!token) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.userId = decoded.userId; 
        req.userName = decoded.name; 
        next();
    } catch (e) {
        return res.status(403).json({ error: "Forbidden: Invalid token" });
    }
};

// ==========================================
// API Routes
// ==========================================

// 1. Google Auth
app.post('/api/auth/google', async (req, res) => {
    try {
        const { token: googleToken } = req.body;

        const googleUser = await verifyGoogleToken(googleToken);
        if (!googleUser) {
            return res.status(401).json({ error: "Invalid Token" });
        }

        const result = await usersCollection.findOneAndUpdate(
            { email: googleUser.email },
            { $set: { name: googleUser.name, picture: googleUser.picture, lastLogin: new Date() },
              $setOnInsert: { joinedEvents: [], createdAt: new Date() } },
            { upsert: true, returnDocument: 'after' } // 'after' returns the updated doc
        );

        // Handle Mongo driver differences: findOneAndUpdate might return { value: doc } or just doc depending on version
        const user = result.value || result; 

        const token = jwt.sign({ userId: user._id, name: user.name }, SECRET_KEY, { expiresIn: '1h' });

        res.cookie('auth_token', token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict'
        });

        res.status(200).json({ _id: user._id, name: user.name, picture: user.picture, joinedEvents: user.joinedEvents });

    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: "Authentication failed" });
    }
});
app.get('/api/auth/me', authenticateJWT, async (req, res) => {
    try {
        const user = await usersCollection.findOne(
            { _id: new ObjectId(req.userId) }, 
            { projection: { _id: 1, name: 1, picture: 1, joinedEvents: 1 } }
        );

        if (!user) return res.status(401).json({ error: "User not found" });

        res.json(user);
    } catch (e) {
        res.status(500).json({ error: "Session check failed" });
    }
});

app.get('/api/events', async (req, res) => {
    try {
        const events = await eventsCollection.find({}).sort({ date: 1 }).toArray();
        res.status(200).json(events);
    } catch (e) {
        res.status(500).json({ error: "Fetch failed" });
    }
});
app.post('/api/events', async (req, res) => {
    try {
        const { title, date, time, location, category, description, creatorId, image } = req.body;
        
        if (!title || !date || !creatorId) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newEvent = {
            title, date, time, location, category, description, creatorId,
            image: image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
            attendees: [],
            comments: [],
            createdAt: new Date()
        };

        const result = await eventsCollection.insertOne(newEvent);
        res.status(201).json({ success: true, eventId: result.insertedId });
    } catch (e) {
        res.status(500).json({ error: "Creation failed" });
    }
});
app.post('/api/events/join', authenticateJWT, async (req, res) => {
    try {
        const userId = req.userId; 
        const { eventId } = req.body;
        if (!eventId) return res.status(400).json({ error: "Missing Event ID" });

        await eventsCollection.updateOne(
            { _id: new ObjectId(eventId) },
            { $addToSet: { attendees: userId } }
        );

        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $addToSet: { joinedEvents: eventId } }
        );

        res.status(200).json({ success: true });
    } catch (e) { 
        res.status(500).json({ error: "Join failed" });
    }
});
app.post('/api/events/comment', authenticateJWT, async (req, res) => {
    try {
        const userId = req.userId; 
        const { eventId, text } = req.body;
        if (!eventId || !text.trim()) return res.status(400).json({ error: "Missing data" });

        const userDoc = await usersCollection.findOne({ _id: new ObjectId(userId) }, { projection: { name: 1 } });
        if (!userDoc) return res.status(404).json({ error: "User not found" });
        const userName = userDoc.name;

        const comment = {
            userId,
            userName,
            text,
            timestamp: new Date()
        };

        await eventsCollection.updateOne(
            { _id: new ObjectId(eventId) },
            { $push: { comments: comment } }
        );

        res.status(200).json({ success: true });
    } catch (e) { 
        res.status(500).json({ error: "Comment failed" });
    }
});

// SPA Fallback
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Export everything needed
module.exports = { app, connectToMongoDB, closeMongoDB, client };