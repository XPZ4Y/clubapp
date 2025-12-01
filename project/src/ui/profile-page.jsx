import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Users, Home, MessageSquare, Bell, Search, MapPin, 
  Clock, ChevronRight, Plus, Heart, Share2, Settings, LogOut, 
  Trophy, User, X, Loader
} from 'lucide-react';

// Added handleLogout to props
export const ProfilePage = ({ user, events, handleLogout }) => {
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
                  {/* Note: The image src is rendered here */}
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
        
        {/* Sign Out Button moved here */}
        <div className="p-6 flex justify-center">
           <button 
             onClick={handleLogout}
             className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
           >
             <LogOut size={20} />
             Sign Out
           </button>
        </div>
        {/* End of moved Sign Out Button */}
        
      </div>
    </div>
  );
};