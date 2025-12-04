import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Users, Home, MessageSquare, Bell, Search, MapPin, 
  Clock, ChevronRight, Plus, Heart, Share2, Settings, LogOut, 
  Trophy, User, X, Loader
} from 'lucide-react';
import { Capacitor } from '@capacitor/core'; // Import Capacitor

import {LoginOverlay} from './ui/sign-in'
import {CreateEventModal} from './ui/create-event-modal'
import {TopBar} from './ui/top-bar'
import {SideNav} from './ui/side-nav'
import {EventCard} from './ui/event-card'
import {Dashboard} from './ui/dashboard'
import {ProfilePage} from './ui/profile-page'

// --- CONFIGURATconst isNative = Capacitor.isNativePlatform();
const isNative = Capacitor.isNativePlatform();
const API_BASE = isNative 
  ? 'https://clubspot-beta.onrender.com' // Use your deployed Render URL for easiest mobile testing
  // OR use your local IP: 'http://192.168.1.X:3000' 
  : '';

const App = () => {
  const [user, setUser] = useState(null); 
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // --- Initial Fetch & Auth Check ---
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('clubspot_token');
      
      if (!token) return; 

      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { 
           headers: {
             'Authorization': `Bearer ${token}`
           }
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData); 
          fetchEvents();
        } else {
          console.log("Token invalid or expired. Logging out.");
          handleLogout(); 
        }
      } catch (e) {
        console.error("Session check failed", e);
        // Don't auto-logout immediately on network error (common on mobile)
        // unless it's a 401/403, but here we just catch generic errors.
      }
    };
    checkSession();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (e) {
      console.error("Failed to fetch events", e);
    }
  };

  const handleLogin = async (googleToken) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleToken })
      });

      if (res.ok) {
        const data = await res.json(); 
        // CHANGED: Save token to localStorage
        localStorage.setItem('clubspot_token', data.token);
        
        setUser(data.user); 
        fetchEvents();
      }
    } catch (e) {
      console.error("Login failed", e);
    }
  };

  const handleLogout = async () => {
    try {
      // Optional: Tell server we are logging out (stateless, but good for logging)
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });
      localStorage.removeItem('clubspot_token');
      
      setUser(null);
      setActiveTab('home');

      //if native, signout from phone
      if (isNative) {
        // Dynamic import to avoid issues on web
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        await GoogleAuth.signOut();
        
      }
    } catch (e) {
      console.error("Logout failed", e);
      // Ensure local cleanup happens even if server call fails
      localStorage.removeItem('clubspot_token');
      setUser(null);
    }
  };

  const handleJoinEvent = async (eventId) => {
    const token = localStorage.getItem('clubspot_token');
    if (!user || !token) return;

    try {
      const res = await fetch(`${API_BASE}/api/events/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // CHANGED: Added Header
        },
        body: JSON.stringify({ eventId })
      });

      if (res.ok) {
        const updatedUser = { ...user, joinedEvents: [...(user.joinedEvents || []), eventId] };
        setUser(updatedUser);
        
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
    const token = localStorage.getItem('clubspot_token');
    if (!user || !text.trim() || !token) return;

    try {
       const res = await fetch(`${API_BASE}/api/events/comment`, {
         method: 'POST',
         headers: { 
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}` // CHANGED: Added Header
         },
         body: JSON.stringify({ eventId, text })
       });
       if (res.ok) {
         fetchEvents(); 
       }
    } catch (e) { console.error(e); }
  };

  const handleDeleteEvent = async (eventId) => {
    const token = localStorage.getItem('clubspot_token');
    if (!token) return;
    
    if (!confirm("Are you sure you want to delete this event?")) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}` // CHANGED: Added Header
        }
      });
      if (res.ok) {
        setEvents(events.filter(e => e._id !== eventId));
      }
    } catch (e) {
      console.error("Delete event failed", e);
    }
  };

  const handleDeleteComment = async (eventId, commentId) => {
    const token = localStorage.getItem('clubspot_token');
    if (!token) return;

    if (!confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/events/${eventId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}` // CHANGED: Added Header
        }
      });
      if (res.ok) {
        fetchEvents(); 
      }
    } catch (e) {
      console.error("Delete comment failed", e);
    }
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
                    <EventCard 
                      key={event._id} 
                      event={event} 
                      user={user} 
                      onJoin={handleJoinEvent} 
                      onComment={handleComment}
                      onDeleteEvent={handleDeleteEvent} 
                      onDeleteComment={handleDeleteComment} 
                    />
                  ))}
                </div>
             </div>
          )}
          {activeTab === 'profile' && user && (
            <ProfilePage 
              user={user} 
              events={events} 
              handleLogout={handleLogout} 
            />
          )}
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