import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Users, Home, MessageSquare, Bell, Search, MapPin, 
  Clock, ChevronRight, Plus, Heart, Share2, Settings, LogOut, 
  Trophy, User, X, Loader
} from 'lucide-react';


export const CreateEventModal = ({ isOpen, onClose, user, refreshEvents }) => {
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
