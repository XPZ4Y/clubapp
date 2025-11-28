const port = process.env.PORT || 3000;
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
require('dotenv').config();

// --- MongoDB Setup ---
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const dbUrl = process.env.DATABASE_URL || "mongodb://localhost:27017";
const DATABASE_NAME = "clubspot";

// Google Auth Library (Uncomment when you have installed: npm install google-auth-library)
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE";
const g_client = new OAuth2Client(GOOGLE_CLIENT_ID);

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

// --- Helper Functions ---

// Mock verification for now. In production, use verifyGoogleToken
async function verifyGoogleToken(token) {
    // REAL IMPLEMENTATION:
    console.log("OIIA")
    const ticket = await g_client.verifyIdToken({
         idToken: token,
         audience: GOOGLE_CLIENT_ID,  
    });
    const payload = ticket.getPayload();
    return payload;
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', 
  '.json': 'application/json',
  default: 'application/octet-stream'
};

// --- Request Handler ---

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // CORS Headers (Useful for development if frontend/backend ports differ)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // --- API Routes ---

    if (pathname.startsWith('/api/')) {
        
        // 1. Google Auth & Login
        if (pathname === '/api/auth/google' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { token } = JSON.parse(body);
                    const googleUser = await verifyGoogleToken(token);
                    
                    if (!googleUser) {
                        res.writeHead(401, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: "Invalid Token" }));
                        return;
                    }

                    // Upsert User (Update if exists, Insert if new)
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

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result)); // Returns the user document
                } catch (e) {
                    console.error(e);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Auth Failed" }));
                }
            });
            return;
        }

        // 2. Events (GET - List, POST - Create)
        if (pathname === '/api/events') {
            if (req.method === 'GET') {
                try {
                    const events = await eventsCollection.find({}).sort({ date: 1 }).toArray();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(events));
                } catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Fetch failed" }));
                }
            } else if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const { title, date, time, location, category, description, creatorId, image } = JSON.parse(body);
                        
                        // Basic Validation
                        if (!title || !date || !creatorId) {
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: "Missing required fields" }));
                            return;
                        }

                        const newEvent = {
                            title, date, time, location, category, description, creatorId,
                            image: image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
                            attendees: [],
                            comments: [],
                            createdAt: new Date()
                        };

                        const result = await eventsCollection.insertOne(newEvent);
                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, eventId: result.insertedId }));
                    } catch (e) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: "Creation failed" }));
                    }
                });
            }
            return;
        }

        // 3. Join Event
        if (pathname === '/api/events/join' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { eventId, userId } = JSON.parse(body);
                    if (!eventId || !userId) throw new Error("Missing IDs");

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

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } catch (e) {
                    console.error(e);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Join failed" }));
                }
            });
            return;
        }

        // 4. Comment on Event
        if (pathname === '/api/events/comment' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { eventId, userId, userName, text } = JSON.parse(body);
                    
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

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Comment failed" }));
                }
            });
            return;
        }

        // 404 for unknown API
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'API Endpoint Not Found' }));
        return;
    }

    // --- Static File Serving (Frontend) ---

    // 1. Determine file path
    // Assumption: The React build output is in a 'dist' folder next to server.js
    let filePath = path.join(__dirname, 'dist', pathname === '/' ? 'index.html' : pathname);
    
    // 2. Security check
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.indexOf(path.resolve(__dirname, 'dist')) !== 0) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // 3. Check if file exists, if not, serve index.html (SPA Fallback)
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Fallback for SPA routing (e.g. /profile -> serve index.html)
            // But only if it's not a file request (like .js or .css)
            if (path.extname(pathname) === '') {
                 filePath = path.join(__dirname, 'dist', 'index.html');
                 fs.readFile(filePath, (err, data) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Error loading index.html');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(data);
                    }
                 });
                 return;
            }

            res.writeHead(404);
            res.end('File not found');
            return;
        }

        // 4. Serve the actual file
        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || mimeTypes.default;

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Internal Server Error');
                return;
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
});

connectToMongoDB().then(success => {
    if (success) {
        server.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    } else {
        console.error('Failed to connect to MongoDB. Server not started.');
        process.exit(1);
    }
});