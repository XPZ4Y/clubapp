const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;

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
app.use(express.json()); 
app.use(cookieParser());

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

const authenticateJWT = (req, res, next) => {
    const token = req.cookies.auth_token;
    if (!token) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.userId = decoded.userId; // Securely attach the validated ID
        req.userName = decoded.name; // Securely attach the validated name (optional, but convenient)
        next();
    } catch (e) {
        return res.status(403).json({ error: "Forbidden: Invalid token" });
    }
};//middleware for authenication

// ==========================================
// API Routes
// ==========================================

// 1. Google Auth
app.post('/api/auth/google', async (req, res) => {
    try {
        const { token: googleToken } = req.body;
        // ... (Verification logic remains the same) ...

        const googleUser = await verifyGoogleToken(googleToken);
        if (!googleUser) {
            return res.status(401).json({ error: "Invalid Token" });
        }

        const result = await usersCollection.findOneAndUpdate(
            { email: googleUser.email },
            { $set: { name: googleUser.name, picture: googleUser.picture, lastLogin: new Date() },
              $setOnInsert: { joinedEvents: [], createdAt: new Date() } },
            { upsert: true, returnDocument: 'after' }
        );

        const user = result.value || result; // The updated user document

        // **VULNERABILITY FIX 1: Create a secure JWT**
        const token = jwt.sign({ userId: user._id, name: user.name }, SECRET_KEY, { expiresIn: '1h' });

        // **VULNERABILITY FIX 2: Send the JWT as an HTTP-Only Cookie**
        // The token is now inaccessible to frontend JavaScript (reducing XSS risk)
        res.cookie('auth_token', token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', // Use secure in production
            sameSite: 'strict'
        });

        // Send a minimal user object for the frontend to display data
        res.status(200).json({ _id: user._id, name: user.name, picture: user.picture, joinedEvents: user.joinedEvents });

    } catch (e) { /* ... error handling ... */ }
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

app.post('/api/events/join', authenticateJWT, async (req, res) => {
    try {
        // **VULNERABILITY FIX 4: Use the SECURE ID from the authenticated token**
        const userId = req.userId; 
        const { eventId } = req.body;
        if (!eventId) return res.status(400).json({ error: "Missing Event ID" });

        // ... (database update logic remains the same, using userId) ...
        await eventsCollection.updateOne(
            { _id: new ObjectId(eventId) },
            { $addToSet: { attendees: userId } }
        );

        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $addToSet: { joinedEvents: eventId } }
        );

        res.status(200).json({ success: true });
    } catch (e) { /* ... error handling ... */ }
});

app.post('/api/events/comment', authenticateJWT, async (req, res) => {
    try {
        // **VULNERABILITY FIX 3: Use the SECURE ID from the authenticated token**
        const userId = req.userId; 
        const { eventId, text } = req.body;
        if (!eventId || !text.trim()) return res.status(400).json({ error: "Missing data" });

        // Optional: Fetch the authoritative name from the database (best practice)
        const userDoc = await usersCollection.findOne({ _id: new ObjectId(userId) }, { projection: { name: 1 } });
        if (!userDoc) return res.status(404).json({ error: "User not found" });
        const userName = userDoc.name;

        // The user details (ID and Name) are now server-validated.
        const comment = {
            userId,
            userName,
            text,
            timestamp: new Date()
        };
        // ... (database update logic remains the same) ...
        await eventsCollection.updateOne(
            { _id: new ObjectId(eventId) },
            { $push: { comments: comment } }
        );

        res.status(200).json({ success: true });
    } catch (e) { /* ... error handling ... */ }
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