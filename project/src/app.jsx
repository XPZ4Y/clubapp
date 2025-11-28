import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Users, Home, MessageSquare, Bell, Search, MapPin, 
  Clock, ChevronRight, Plus, Heart, Share2, Settings, LogOut, 
  Trophy, User, X, Loader
} from 'lucide-react';

// --- CONFIGURATION ---
// PASTE YOUR CLIENT ID HERE from the Google Cloud Console
const GOOGLE_CLIENT_ID = "611302719944-je4tkbl7i7v80169ann7blnmmok36tva.apps.googleusercontent.com"; 

// --- Components ---

const LoginOverlay = ({ onLogin }) => {
  const googleButtonRef = useRef(null);

  useEffect(() => {
    // Prevent execution if ID is not set
    if (GOOGLE_CLIENT_ID === "PASTE_YOUR_CLIENT_ID_HERE") {
        console.warn("ClubSpot: Google Client ID is missing.");
        return;
    }

    const initializeGsi = () => {
      // Critical Safety Check: Ensure the container element exists
      if (!window.google || !googleButtonRef.current) return;
      
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            onLogin(response.credential);
          }
        });

        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          { theme: "outline", size: "large", width: "100%" } 
        );
      } catch (error) {
        console.error("GSI Render Error:", error);
      }
    };

    // Check if script is already present (from previous mounts)
    if (window.google && window.google.accounts) {
      initializeGsi();
    } else {
      // Load script dynamically
      const script = document.createElement('script');
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGsi;
      document.body.appendChild(script);

      return () => {
        // Optional cleanup
        if(document.body.contains(script)) {
            document.body.removeChild(script);
        }
      };
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-indigo-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <Users className="text-indigo-600" size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">ClubSpot</h2>
          <p className="text-gray-500">Connect, Collaborate, Create.</p>
        </div>
        
        <div className="space-y-3 min-h-[50px] flex justify-center">
          {GOOGLE_CLIENT_ID === "PASTE_YOUR_CLIENT_ID_HERE" ? (
             <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">
               ⚠️ Please paste your Google Client ID in app.jsx line 10 to see the login button.
             </div>
          ) : (
             <div ref={googleButtonRef} className="w-full flex justify-center"></div>
          )}
        </div>
          
        <div className="text-xs text-gray-400 mt-4">
           By continuing, you agree to our Terms & Privacy Policy.
        </div>
      </div>
    </div>
  );
};

const CreateEventModal = ({ isOpen, onClose, user, refreshEvents }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', date: '', time: '', location: '', category: 'General', description: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, creatorId: user._id })
      });
      if (response.ok) {
        refreshEvents();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create New Event</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
            <input 
              required
              className="w-full bg-gray-50 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-indigo-500" 
              placeholder="e.g. Hackathon Kickoff"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
               <input 
                 required type="date"
                 className="w-full bg-gray-50 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-indigo-500" 
                 value={formData.date}
                 onChange={e => setFormData({...formData, date: e.target.value})}
               />
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Time</label>
               <input 
                 required type="time"
                 className="w-full bg-gray-50 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-indigo-500" 
                 value={formData.time}
                 onChange={e => setFormData({...formData, time: e.target.value})}
               />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Location</label>
               <input 
                 required
                 className="w-full bg-gray-50 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-indigo-500" 
                 placeholder="Room 101"
                 value={formData.location}
                 onChange={e => setFormData({...formData, location: e.target.value})}
               />
            </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
               <select 
                 className="w-full bg-gray-50 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                 value={formData.category}
                 onChange={e => setFormData({...formData, category: e.target.value})}
               >
                 <option>General</option>
                 <option>Tech</option>
                 <option>Social</option>
                 <option>Outdoor</option>
               </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
            <textarea 
              className="w-full bg-gray-50 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none" 
              placeholder="What's this event about?"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader className="animate-spin" size={20} /> : "Publish Event"}
          </button>
        </form>
      </div>
    </div>
  );
};

const TopBar = ({ title, user, setShowProfile }) => (
  <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center transition-all duration-300">
    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
    {user && (
      <div className="flex items-center space-x-3">
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative hidden md:block">
           <Search size={20} />
        </button>
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <img 
          onClick={setShowProfile}
          src={user.picture || "https://i.pravatar.cc/150?u=me"} 
          alt="Profile" 
          className="w-9 h-9 rounded-full border-2 border-indigo-100 cursor-pointer hover:border-indigo-500 transition-colors"
        />
      </div>
    )}
  </div>
);

const SideNav = ({ activeTab, setActiveTab }) => (
  <div className="hidden md:flex flex-col items-center py-8 w-24 bg-white border-r border-gray-100 h-full fixed left-0 top-0 z-40 shadow-sm">
    <div className="mb-10 p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
      <Trophy className="text-white" size={24} />
    </div>
    <div className="flex flex-col gap-6 w-full px-4">
      {[
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'events', icon: Calendar, label: 'Events' },
        { id: 'community', icon: Users, label: 'Club' },
        { id: 'profile', icon: User, label: 'Profile' },
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 group relative w-full ${
            activeTab === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
          }`}
        >
          <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
          <span className="text-[10px] font-bold">{item.label}</span>
        </button>
      ))}
    </div>
  </div>
);

const EventCard = ({ event, user, onJoin, onComment }) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const hasJoined = event.attendees?.includes(user._id);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      <div className="h-48 overflow-hidden relative">
        <img 
          src={event.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87"} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          alt={event.title}
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-indigo-900 shadow-sm">
          {event.category || 'General'}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-indigo-600 text-sm font-bold mb-1 uppercase tracking-wide">
              {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
            <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1">{event.title}</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-gray-500 text-sm mb-4">
          <div className="flex items-center gap-1.5">
            <Clock size={16} />
            {event.time}
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <MapPin size={16} />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Action Area */}
        <div className="mt-auto pt-4 border-t border-gray-50 space-y-3">
          <div className="flex items-center justify-between">
             <div className="flex -space-x-2">
               {/* Mock attendees avatars */}
               {(event.attendees || []).slice(0, 3).map((a, i) => (
                 <div key={i} className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs text-indigo-600 font-bold">
                   {a.slice(0,1)}
                 </div>
               ))}
               {(event.attendees?.length || 0) > 0 && (
                 <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500">
                   {event.attendees.length}
                 </div>
               )}
             </div>

             <div className="flex gap-2">
               <button onClick={() => setShowComments(!showComments)} className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors">
                 <MessageSquare size={20} />
               </button>
               <button 
                 onClick={() => onJoin(event._id)}
                 disabled={hasJoined}
                 className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm ${
                   hasJoined 
                   ? 'bg-green-100 text-green-700 cursor-default'
                   : 'bg-gray-900 text-white hover:bg-indigo-600 hover:shadow-lg'
                 }`}
               >
                 {hasJoined ? 'Joined' : 'Join'}
               </button>
             </div>
          </div>

          {showComments && (
            <div className="animate-fade-in bg-gray-50 rounded-xl p-3 mt-2">
               <div className="max-h-32 overflow-y-auto space-y-2 mb-2 custom-scrollbar">
                  {(event.comments || []).length === 0 && <p className="text-xs text-gray-400 text-center">No comments yet.</p>}
                  {(event.comments || []).map((c, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-lg text-xs shadow-sm">
                      <span className="font-bold text-indigo-600 mr-1">{c.userName}:</span>
                      <span className="text-gray-700">{c.text}</span>
                    </div>
                  ))}
               </div>
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={commentText}
                   onChange={e => setCommentText(e.target.value)}
                   placeholder="Add a comment..."
                   className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-indigo-500"
                 />
                 <button 
                   onClick={() => {
                     onComment(event._id, commentText);
                     setCommentText('');
                   }}
                   className="text-indigo-600 font-bold text-xs px-2 hover:bg-indigo-50 rounded"
                 >Post</button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Pages ---

const Dashboard = ({ user, events, onJoin, onComment }) => (
  <div className="pb-24 md:pb-10 space-y-6 animate-fade-in max-w-7xl mx-auto w-full px-6">
    <TopBar title={`Hello, ${user.name.split(' ')[0]}!`} user={user} />
    
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Featured Card */}
      <div className="lg:col-span-2 relative h-64 md:h-80 rounded-3xl overflow-hidden shadow-xl group cursor-pointer">
        <img 
          src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=2000" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          alt="Featured" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white max-w-lg">
          <span className="bg-indigo-500 text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block uppercase tracking-wider">Featured</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">University Gala Night</h2>
          <p className="text-gray-200 font-medium flex items-center gap-2 text-sm md:text-base">
            <MapPin size={16} /> Grand Ballroom • Next Friday
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full flex flex-col">
         <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Stats</h3>
         <div className="flex-1 grid grid-cols-2 gap-4">
             <div className="bg-blue-50 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                <span className="text-3xl font-bold text-blue-600">{user.joinedEvents?.length || 0}</span>
                <span className="text-xs font-bold text-blue-400 uppercase">Events Joined</span>
             </div>
             <div className="bg-purple-50 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                <span className="text-3xl font-bold text-purple-600">{events.length}</span>
                <span className="text-xs font-bold text-purple-400 uppercase">Available</span>
             </div>
         </div>
         <div className="mt-4 pt-4 border-t border-gray-100">
           <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Upcoming</h4>
           {events.slice(0,2).map(e => (
             <div key={e._id} className="flex items-center gap-3 py-2">
               <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 flex flex-col items-center justify-center text-xs font-bold text-gray-500 leading-none">
                  <span>{new Date(e.date).getDate()}</span>
                  <span className="text-[8px] uppercase">{new Date(e.date).toLocaleString('default', { month: 'short' })}</span>
               </div>
               <div className="truncate">
                 <div className="text-sm font-bold text-gray-800 truncate">{e.title}</div>
                 <div className="text-xs text-gray-400 truncate">{e.location}</div>
               </div>
             </div>
           ))}
         </div>
      </div>
    </div>
    
    <h3 className="text-xl font-bold text-gray-800 mt-4">Discover Events</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {events.map(event => (
         <EventCard key={event._id} event={event} user={user} onJoin={onJoin} onComment={onComment} />
       ))}
    </div>
  </div>
);

const ProfilePage = ({ user, events }) => {
  const joined = events.filter(e => user.joinedEvents?.includes(e._id));
  
  return (
    <div className="pb-24 md:pb-10 animate-fade-in w-full">
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <button className="absolute top-6 right-6 p-2 bg-white/20 backdrop-blur text-white rounded-full hover:bg-white/30 transition-colors">
          <Settings size={20} />
        </button>
      </div>
      
      <div className="px-6 relative -mt-16 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-8 text-center relative z-10">
          <img 
            src={user.picture || "https://i.pravatar.cc/150?u=me"} 
            alt="Profile" 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-md mx-auto -mt-20 md:-mt-24 mb-4 bg-white object-cover" 
          />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-gray-500 text-sm md:text-base font-medium mb-8">{user.email}</p>
          
          <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-8 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-gray-900">{user.joinedEvents?.length || 0}</div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Events</div>
            </div>
            <div className="text-center border-l border-r border-gray-100">
              <div className="text-xl md:text-2xl font-bold text-gray-900">0</div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Created</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-gray-900">0</div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Points</div>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-800 mt-8 mb-4 px-2">Your Events</h3>
        <div className="space-y-4">
           {joined.length === 0 && (
             <div className="text-center p-8 bg-white rounded-3xl border border-dashed border-gray-300 text-gray-400">
                You haven't joined any events yet.
             </div>
           )}
           {joined.map(event => (
             <div key={event._id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
                  <img src={event.image} className="w-full h-full object-cover" />
                </div>
                <div>
                   <h4 className="font-bold text-gray-900">{event.title}</h4>
                   <p className="text-sm text-gray-500">{event.date} • {event.location}</p>
                </div>
                <div className="ml-auto">
                   <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-lg">Going</span>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null); // Auth state
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Initial Fetch & Auth Check
  useEffect(() => {
    // Check localStorage for persisted user (Simple implementation)
    const storedUser = localStorage.getItem('clubspot_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchEvents();
    }
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (e) {
      console.error("Failed to fetch events", e);
    }
  };

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

  return (
    <div className="min-h-screen w-full bg-gray-50 font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900 flex">
      {!user && <LoginOverlay onLogin={handleLogin} />}
      
      {/* Modals */}
      <CreateEventModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        user={user}
        refreshEvents={fetchEvents}
      />

      {/* Desktop Side Navigation */}
      <SideNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen md:pl-24 transition-all duration-300 relative">
        <main className="flex-1 overflow-y-auto scroll-smooth no-scrollbar w-full">
          {activeTab === 'home' && user && (
            <Dashboard 
              user={user} 
              events={events} 
              onJoin={handleJoinEvent}
              onComment={handleComment}
            />
          )}
          {activeTab === 'events' && (
             <div className="p-6">
                <TopBar title="All Events" user={user} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {events.map(event => (
                    <EventCard key={event._id} event={event} user={user} onJoin={handleJoinEvent} onComment={handleComment} />
                  ))}
                </div>
             </div>
          )}
          {activeTab === 'profile' && user && <ProfilePage user={user} events={events} />}
          {activeTab === 'community' && (
            <div className="flex items-center justify-center h-full text-gray-400 font-medium">Community Features Coming Soon</div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 pb-6 flex justify-between items-center z-40 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        {[
          { id: 'home', icon: Home, label: 'Home' },
          { id: 'events', icon: Calendar, label: 'Events' },
          { id: 'add', icon: Plus, label: 'New', isFab: true },
          { id: 'community', icon: Users, label: 'Club' },
          { id: 'profile', icon: User, label: 'Profile' },
        ].map((item) => {
          if (item.isFab) {
             return (
               <button 
                 key={item.id}
                 onClick={() => setShowCreateModal(true)}
                 className="bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-indigo-300 transform -translate-y-4 hover:scale-105 active:scale-95 transition-all duration-300 border-4 border-gray-50"
               >
                 <item.icon size={24} />
               </button>
             )
          }
          
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <item.icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(100px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;