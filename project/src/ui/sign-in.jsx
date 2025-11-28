import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Users, Home, MessageSquare, Bell, Search, MapPin, 
  Clock, ChevronRight, Plus, Heart, Share2, Settings, LogOut, 
  Trophy, User, X, Loader
} from 'lucide-react';

import {GOOGLE_CLIENT_ID} from './google-client-id'



export const LoginOverlay = ({ onLogin }) => {
  const googleButtonRef = useRef(null);

  useEffect(() => {
    if (GOOGLE_CLIENT_ID === "PASTE_YOUR_CLIENT_ID_HERE") {
        console.warn("ClubSpot: Google Client ID is missing.");
        return;
    }

    const initializeGsi = () => {
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

    if (window.google && window.google.accounts) {
      initializeGsi();
    } else {
      const script = document.createElement('script');
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGsi;
      document.body.appendChild(script);
      return () => {
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