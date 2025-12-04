import React, { useEffect, useRef, useState } from 'react';
import { Users, XCircle, AlertTriangle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

// Keep this for Web fallback
import { GOOGLE_CLIENT_ID } from './google-client-id';

export const LoginOverlay = ({ onLogin }) => {
  const googleButtonRef = useRef(null);
  const isNative = Capacitor.isNativePlatform();
  
  // State to hold the debug error message
  const [debugError, setDebugError] = useState(null);

  // Helper to ensure we can read the error object on screen
  const formatError = (err) => {
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    try {
      return JSON.stringify(err, null, 2);
    } catch (e) {
      return "Unknown error occurred";
    }
  };

  useEffect(() => {
    // 1. Initialize Capacitor Google Auth (For Android)
    if (isNative) {
      GoogleAuth.initialize();
      return; 
    }

    // 2. Web Fallback Logic
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes("YOUR_CLIENT_ID")) {
      setDebugError("ClubSpot: Google Client ID is missing or invalid.");
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
        setDebugError("GSI Render Error: " + formatError(error));
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
        // Capture the full user object to see what WAS returned if the token is missing
        setDebugError("No ID token received. Raw Response:\n" + formatError(user));
      }
    } catch (error) {
      // This will catch API Key mismatches, keystore hash issues, or cancellation
      setDebugError("Native Login Failed:\n" + formatError(error));
    }
  };

  return (
    <>
      {/* --- DEBUG ERROR POPUP START --- */}
      {debugError && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 animate-pulse">
          <div className="bg-red-50 border-4 border-red-500 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-red-500 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <AlertTriangle size={24} />
                <span>CRITICAL ERROR</span>
              </div>
              <button onClick={() => setDebugError(null)} className="text-white hover:bg-red-600 rounded-full p-1">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-red-900 font-bold mb-2">The app encountered an error:</p>
              <div className="bg-white border border-red-200 p-3 rounded text-xs font-mono text-red-700 whitespace-pre-wrap break-all h-64 overflow-y-auto">
                {debugError}
              </div>
              <button 
                onClick={() => setDebugError(null)}
                className="mt-4 w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700"
              >
                Dismiss & Retry
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- DEBUG ERROR POPUP END --- */}

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
                   ⚠️ Thou needst google client ID.
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
    </>
  );
};