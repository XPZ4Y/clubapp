import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Users, Home, MessageSquare, Bell, Search, MapPin, 
  Clock, ChevronRight, Plus, Heart, Share2, Settings, LogOut, 
  Trophy, User, X, Loader
} from 'lucide-react';

import {TopBar} from './top-bar'
import {EventCard} from './event-card'

export const Dashboard = ({ user, events, onJoin, onComment }) => (
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