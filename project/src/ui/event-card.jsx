import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Users, Home, MessageSquare, Bell, Search, MapPin, 
  Clock, ChevronRight, Plus, Heart, Share2, Settings, LogOut, 
  Trophy, User, X, Loader, Trash2
} from 'lucide-react';

export const EventCard = ({ event, user, onJoin, onComment, onDeleteEvent, onDeleteComment }) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const hasJoined = event.attendees?.includes(user._id);
  const isCreator = user._id === event.creatorId;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col h-full relative">
      
      {/* Delete Event Button - Only for Creator */}
      {isCreator && onDeleteEvent && (
        <button 
          onClick={() => onDeleteEvent(event._id)}
          className="absolute top-4 left-4 z-10 bg-white/90 p-2 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
          title="Delete Event"
        >
          <Trash2 size={16} />
        </button>
      )}

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
            {/* Created By Feature */}
            {event.creatorName && (
              <p className="text-xs text-gray-400 font-medium">Posted by {event.creatorName}</p>
            )}
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
                    <div key={idx} className="bg-white p-2 rounded-lg text-xs shadow-sm flex justify-between items-start group/comment">
                      <div>
                        <span className="font-bold text-indigo-600 mr-1">{c.userName}:</span>
                        <span className="text-gray-700">{c.text}</span>
                      </div>
                      
                      {/* Delete Comment Button - Only for Author */}
                      {user._id === c.userId && onDeleteComment && (
                        <button 
                          onClick={() => onDeleteComment(event._id, c._id)}
                          className="text-gray-300 hover:text-red-500 opacity-0 group-hover/comment:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
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