const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

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
const port = process.env.PORT || 3000;

// --- Middleware ---
// Replaces manual CORS headers
app.use(cors()); 

// Replaces the req.on('data') buffer logic for parsing JSON bodies
app.use(express.json()); 

// Serve static files from 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// --- Database Connection ---
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

async function verifyGoogleToken(token) {
    const ticket = await g_client.verifyIdToken({
         idToken: token,
         audience: GOOGLE_CLIENT_ID,  
    });
    return ticket.getPayload();
}

// ==========================================
// API Routes
// ==========================================

// 1. Google Auth
app.post('/api/auth/google', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: "Token required" });

        const googleUser = await verifyGoogleToken(token);
        
        if (!googleUser) {
            return res.status(401).json({ error: "Invalid Token" });
        }

        const result = await usersCollection.findOneAndUpdate(
            { email: googleUser.email },
            { 
                $set: { 
                    name: googleUser.name, 
                    picture: googleUser.picture,
                    lastLogin: new Date()
                },
                $setOnInsert: { 
                    joinedEvents: [],
                    createdAt: new Date()
                }
            },
            { upsert: true, returnDocument: 'after' }
        );

        res.status(200).json(result); // Using .json() automatically sets content-type
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Auth Failed" });
    }
});

// 2. Get All Events
app.get('/api/events', async (req, res) => {
    try {
        const events = await eventsCollection.find({}).sort({ date: 1 }).toArray();
        res.status(200).json(events);
    } catch (e) {
        res.status(500).json({ error: "Fetch failed" });
    }
});

// 3. Create Event
app.post('/api/events', async (req, res) => {
    try {
        // Express automatically parses the body into req.body
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

// 4. Join Event
app.post('/api/events/join', async (req, res) => {
    try {
        const { eventId, userId } = req.body;
        if (!eventId || !userId) return res.status(400).json({ error: "Missing IDs" });

        // Add user to event attendees
        await eventsCollection.updateOne(
            { _id: new ObjectId(eventId) },
            { $addToSet: { attendees: userId } }
        );

        // Add event to user's joined list
        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $addToSet: { joinedEvents: eventId } }
        );

        res.status(200).json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Join failed" });
    }
});

// 5. Comment on Event
app.post('/api/events/comment', async (req, res) => {
    try {
        const { eventId, userId, userName, text } = req.body;
        
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

// ==========================================
// SPA Fallback (Frontend Routing)
// ==========================================
// Any request that didn't match an API route or a static file
// returns the index.html so the frontend router can take over.
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ==========================================
// Server Startup
// ==========================================
connectToMongoDB().then(success => {
    if (success) {
        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    } else {
        console.error('Failed to connect to MongoDB. Server not started.');
        process.exit(1);
    }
});