import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Users, Home, MessageSquare, Bell, Search, MapPin, 
  Clock, ChevronRight, Plus, Heart, Share2, Settings, LogOut, 
  Trophy, User, X, Loader
} from 'lucide-react';

import {LoginOverlay} from './ui/sign-in'
import {CreateEventModal} from './ui/create-event-modal'
import {TopBar} from './ui/top-bar'
import {SideNav} from './ui/side-nav'
import {EventCard} from './ui/event-card'
import {Dashboard} from './ui/dashboard'
import {ProfilePage} from './ui/profile-page'

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