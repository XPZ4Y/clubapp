import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent} from '@testing-library/preact';
import React from 'preact/compat'; 
import App from '../src/app.jsx'; 

import { MOCK_USER, MOCK_EVENTS } from './fixtures';

vi.mock('../google-client-id', () => ({//yer dolt failed to define /google-client-id
  GOOGLE_CLIENT_ID: () => null 
}));



const setupMockServer = () => {
  return vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET';
    const headers = options.headers || {};
    const body = options.body || 'No Client ID provided';

    // 🛡️ MIDDLEWARE MOCK: Check for Valid Token
    const requireAuth = () => {
      const authHeader = headers['Authorization'];
      if (!authHeader) {
        return { ok: false, status: 401, json: async () => ({ error: "Unauthorized" }) };
      }
      if (!authHeader.includes('valid_token')) {
        return { ok: false, status: 403, json: async () => ({ error: "Forbidden" }) };
      }
      return null; // Pass
    };

    // 1. Auth: Google Login (Public) !!relevant
    if (url.includes('/api/auth/google') && method === 'POST') {
      console.log(body)
      return { 
        ok: true, 
        json: async () => ({ 
          success: true, 
          token: 'valid_token', 
          user: MOCK_USER 
        }) 
      };
    }

    // 2. Auth: Logout (Public in your app, but good to handle)
    if (url.includes('/api/auth/logout') && method === 'POST') {
      return { ok: true, json: async () => ({ success: true }) };
    }

    // 3. Auth: Session Check (Me) [PROTECTED]
    if (url.includes('/api/auth/me') && method === 'GET') {
      const authError = requireAuth();
      if (authError) return authError;
      
      return { ok: true, json: async () => MOCK_USER };
    }

    // 4. Events: List (GET) [PUBLIC]
    // We check this early for GET, as it's the only public event route
    if (url.includes('/api/events') && method === 'GET') {
       return { ok: true, json: async () => MOCK_EVENTS };
    }


    // 5. Events: Join (POST) [PROTECTED]
    if (url.includes('/api/events/join') && method === 'POST') {
      const authError = requireAuth();
      if (authError) return authError;

      return { ok: true, json: async () => ({ success: true }) };
    }

    // 6. Events: Comment (POST) [PROTECTED]
    if (url.includes('/api/events/comment') && method === 'POST') {
      const authError = requireAuth();
      if (authError) return authError;
      console.log(headers)
      return { ok: true, json: async () => ({ success: true }) };
    }

    // 7. Events: Delete Comment (DELETE) [PROTECTED]
    if (url.includes('/comments/') && method === 'DELETE') {
      const authError = requireAuth();
      if (authError) return authError;

      return { ok: true, json: async () => ({ success: true }) };
    }

    // 8. Events: Delete Event (DELETE) [PROTECTED]
    if (url.includes('/api/events/') && method === 'DELETE') {
      const authError = requireAuth();
      if (authError) return authError;

      return { ok: true, json: async () => ({ success: true }) };
    }

    // 9. Events: Create (POST) [PROTECTED]
    // Matches app.js: returns { success: true, eventId }
    if (url.includes('/api/events') && method === 'POST') {
       const authError = requireAuth();
       if (authError) return authError;

       return { 
         ok: true, 
         json: async () => ({ success: true, eventId: 'new_evt_123' }) 
       };
    }

    return { ok: false, status: 404, statusText: 'Not Found' };
  });
};
describe('Fuck up test', () => {
  
  beforeEach(() => {
    localStorage.clear();
    global.fetch = setupMockServer();
    vi.clearAllMocks();
  });

  it('Render Login Overlay', async () => {
    render(<App />);
    expect(await screen.findByText(/Connect, Collaborate, Create/i)).toBeInTheDocument();

    const sigIn = await screen.findByText(/Sign in with Google|Sign in|Sign out/i);
    sigIn.click();
    console.log("SSIGNIN")
    //console.log(Capacitor)
  });

})