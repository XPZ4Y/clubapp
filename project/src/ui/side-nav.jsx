import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Users, Home, MessageSquare, Bell, Search, MapPin, 
  Clock, ChevronRight, Plus, Heart, Share2, Settings, LogOut, 
  Trophy, User, X, Loader
} from 'lucide-react';

export const SideNav = ({ activeTab, setActiveTab }) => (
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