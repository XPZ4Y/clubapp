import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent} from '@testing-library/preact';
import React from 'preact/compat'; 
import App from '../src/app.jsx'; 

// Import shared data
import { MOCK_USER, MOCK_EVENTS } from './fixtures';

// --- LOCAL MOCKS (Specific to this test only) ---
// We keep SideNav here because other tests might want to test the REAL SideNav.
vi.mock('../src/ui/side-nav', () => ({
  SideNav: () => null 
}));

// --- SERVER MOCK HELPER ---
const setupMockServer = () => {
  return vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET';
    const headers = options.headers || {};

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

    // 1. Auth: Google Login (Public)
    // Matches app.js: returns { success: true, token, user }
    if (url.includes('/api/auth/google') && method === 'POST') {
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

    // --- FROM HERE DOWN, ALL ROUTES ARE PROTECTED ---

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

// --- THE TESTS ---
describe('Full App Integration', () => {
  
  beforeEach(() => {
    localStorage.clear();
    global.fetch = setupMockServer();
    vi.clearAllMocks();
  });

  it('Render Login Overlay', async () => {
    render(<App />);
    expect(await screen.findByText(/Connect, Collaborate, Create/i)).toBeInTheDocument();
  });

  it('if(token?) show events', async () => {
    localStorage.setItem('clubspot_token', 'valid_token');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Hello, Jade/i)).toBeInTheDocument();
    }, { timeout: 0 });

    const eventTitles = await screen.findAllByText('Dragon Boat Festival', {}, { timeout: 0 });
    expect(eventTitles.length).toBeGreaterThan(0);

    const comment = await screen.findAllByText('The Grand Tournament', {}, { timeout: 0 });
    expect(comment.length).toBeGreaterThan(0);
  });

  it('allows a user to join an event', async () => {
    localStorage.setItem('clubspot_token', 'valid_token');
    render(<App />);

    // Await the scroll to unfurl (events load)
    const joinButtons = await screen.findAllByText('Join');
    // We choose the first quest available
    const buttonToClick = joinButtons[0];
    
    // Execute the pledge
    buttonToClick.click();

    // Verily, the text should change to reflect the new alliance
    await waitFor(() => {
      expect(screen.getByText('Joined')).toBeInTheDocument();
    });
  });

  it('allows a user to leave a comment', async () => {
    localStorage.setItem('clubspot_token', 'valid_token');
    render(<App />);

    // Wait for the festivities to appear
    await screen.findAllByText('The Grand Tournament');

    // Reveal the parchment
    // We find the 'Join' button and seek its preceding sibling (the comment icon button)
    const joinButtons = await screen.findAllByText('Join');
    const commentButton = joinButtons[0].previousElementSibling;
    commentButton.click();

    // Inscribe the message
    const input = await screen.findByPlaceholderText('Add a comment...');
    
    // Dip the quill using fireEvent for reliability
    // This ensures the React state 'commentText' is actually updated!
    fireEvent.change(input, { target: { value: 'Huzzah! I bring mead!' } });

    // Dispatch the courier
    const postBtn = screen.getByText('Post');
    postBtn.click();

    // Verify the courier was dispatched with our payload (The Server Success)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/events/comment'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Huzzah! I bring mead!')
        })
      );
    });

    // The quill should be wiped clean upon success
    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  /* * ---------------------------------------------------------------------------
   * 📜 The Architect's Decree: We shall attempt to forge a new realm (Event).
   * We summon the creation modal. Alas, the 'New' text is invisible to the
   * naked eye (DOM), hidden within the mobile navigation's styles. We must
   * seek the indigo seal (button) directly to trigger the modal.
   * ---------------------------------------------------------------------------
   */
  it('allows a user to create a new event', async () => {
    localStorage.setItem('clubspot_token', 'valid_token');
    const { container } = render(<App />);

    // Wait for the realm to load
    await screen.findAllByText('Dragon Boat Festival');

    // Summon the Creation Modal
    // We find the FAB by its unique indigo class since 'New' text is hidden
    const createBtn = container.querySelector('button.bg-indigo-600'); 
    createBtn.click();

    // Verify the scroll has opened
    expect(await screen.findByText('Create New Event')).toBeInTheDocument();

    // Scribe the details
    const titleInput = screen.getByPlaceholderText('e.g. Hackathon Kickoff');
    const locationInput = screen.getByPlaceholderText('Room 101');
    const dateInput = container.querySelector('input[type="date"]');
    const timeInput = container.querySelector('input[type="time"]');

    // Use fireEvent to reliably trigger State updates in Preact/React
    fireEvent.change(titleInput, { target: { value: 'The Royal Ball' } });
    fireEvent.change(locationInput, { target: { value: 'The Grand Palace' } });
    fireEvent.change(dateInput, { target: { value: '2025-12-31' } });
    fireEvent.change(timeInput, { target: { value: '20:00' } });

    // Seal the Decree
    const publishBtn = screen.getByText('Publish Event');
    publishBtn.click();

    // Verify the courier was dispatched with our payload
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/events'),
        expect.objectContaining({
          method: 'POST',
          // We check that the body contains the title we just typed
          body: expect.stringContaining('The Royal Ball')
        })
      );
    });
  });
});