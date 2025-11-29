Documentation 11-28-2025
========================

Frontend `/project`:
--------------------

The frontend is to allow user communication with the server. This will allow
the authenticated users to view existing events in the data-pool, post comments
to the data-pool, and create new events in the data-pool; 
1. The `/src` directory contains all the development files
2. The code is modular, `app.jsx` calls separate modules from `/ui` directory
3. Frontend sends req to `/api/endpoint` or direct, depending on the development status

## List of built modules.jsx in `/ui` sorted by size, marked with 'fetch/post' responsibility:
1. event-card 
2. create-event-modal *('/api/events')*
3. dashboard *('/api/events/join') ('/api/events/comment')*
4. profile-page
5. sign-in *('/api/auth/google')*
6. side-nav
7. top-bar
8. google-client-id *imp*




Backend `/server`:
------------------
The backend is to accept authenticated requests, and return a deterministic reply to the
frontend in form of data fetched from one of the ONLY two sources:
1. Google account authentication
2. Mongodb (for the storage of events & userdata in this prototype)
3. Requires the built `/dist` directory within the directory it is in.



Issue:
this frontend code snippet writes user credentials after google auth directly into the
*localStorage*, and the frontend trusts blindly whatever is in the local storage.
I can exploit this by editing my name in the local storage
```js
  const handleLogin = async (token) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData.value || userData); // Handle findOneAndUpdate return
        localStorage.setItem('clubspot_user', JSON.stringify(userData.value || userData));
        fetchEvents();
      }
    } catch (e) {
      console.error("Login failed", e);
    }
  };
  const handleJoinEvent = async (eventId) => {
    if (!user) return;
    try {
      const res = await fetch('/api/events/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, userId: user._id })
      });
      if (res.ok) {
        // Optimistic UI update or Refetch
        // Updating user state locally for immediate feedback
        const updatedUser = { ...user, joinedEvents: [...(user.joinedEvents || []), eventId] };
        setUser(updatedUser);
        localStorage.setItem('clubspot_user', JSON.stringify(updatedUser));
        
        // Update events list to show attendee count increase
        setEvents(events.map(e => 
          e._id === eventId 
            ? { ...e, attendees: [...(e.attendees || []), user._id] }
            : e
        ));
      }
    } catch (e) {
      console.error("Join failed", e);
    }
  };
  const handleComment = async (eventId, text) => {
    if (!user || !text.trim()) return;
    try {
       const res = await fetch('/api/events/comment', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ eventId, userId: user._id, userName: user.name, text })
       });
       if (res.ok) {
         fetchEvents(); // Refetch to see new comment
       }
    } catch (e) { console.error(e); }
  };
```
This is the comment handler+rest (backend) Notice how it trusts
whatever is on the *req.body*? Rookie mistake. Never trust the frontend, it is the frontend that
trusts the server. Rookie mistake by gemini pro.
```node
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
```
Goal: To make sure the user can't edit the local storage, or something that seals the identity
	directly to the google account.
Assume all other parts of the code are iniialized. Just fix the Frontend-Backend communication


FIX