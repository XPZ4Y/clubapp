import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Users, Home, MessageSquare, Bell, Search, MapPin, 
  Clock, ChevronRight, Plus, Heart, Share2, Settings, LogOut, 
  Trophy, User, X, Loader
} from 'lucide-react';

export const TopBar = ({ title, user, setShowProfile }) => (
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
