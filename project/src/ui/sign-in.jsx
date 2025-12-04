import React, { useEffect, useRef } from 'react';
import { Users } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

// Keep this for Web fallback
import { GOOGLE_CLIENT_ID } from './google-client-id';

export const LoginOverlay = ({ onLogin }) => {
  const googleButtonRef = useRef(null);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    // 1. Initialize Capacitor Google Auth (For Android)
    if (isNative) {
      GoogleAuth.initialize();
      return; 
    }

    // 2. Web Fallback Logic
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes("YOUR_CLIENT_ID")) {
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
        if(document.body && document.body.contains(script)) {
            document.body.removeChild(script);
        }
      };
    }
  }, [isNative]);

  const handleNativeGoogleLogin = async () => {
    try {
      const user = await GoogleAuth.signIn();
      // On Android, 'authentication.idToken' is usually the one you want to send to backend
      if (user.authentication && user.authentication.idToken) {
        onLogin(user.authentication.idToken);
      } else {
        console.error("No ID token received from Google Plugin", user);
        alert("Google Sign-In failed to retrieve token.");
      }
    } catch (error) {
      console.error("Native Google Login Failed", error);
    }
  };

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
        
        <div className="space-y-3 min-h-[50px] flex justify-center w-full">
          {/* NATIVE ANDROID BUTTON */}
          {isNative ? (
            <button
              onClick={handleNativeGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-md p-3 hover:bg-gray-50 transition-colors shadow-sm active:bg-gray-100"
            >
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                alt="Google" 
                className="w-5 h-5"
              />
              <span className="text-gray-700 font-medium font-roboto">Sign in with Google</span>
            </button>
          ) : (
            /* WEB BUTTON CONTAINER */
            (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes("YOUR_CLIENT_ID")) ? (
               <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">
                 ⚠️ Thou needst google  client ID.
               </div>
            ) : (
               <div ref={googleButtonRef} className="w-full flex justify-center"></div>
            )
          )}
        </div>
          
        <div className="text-xs text-gray-400 mt-4">
           By continuing, you agree to our Terms & Privacy Policy.
        </div>
      </div>
    </div>
  );
};