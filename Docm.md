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

