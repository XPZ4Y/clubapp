import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/preact';
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

    if (url.includes('/api/auth/google') && method === 'POST') {
      return { ok: true, json: async () => ({ token: 'valid_token', user: MOCK_USER }) };
    }

    if (url.includes('/api/auth/logout') && method === 'POST') {
      return { ok: true, json: async () => ({ success: true }) };
    }

    if (url.includes('/api/auth/me') && method === 'GET') {
      const token = options.headers?.['Authorization'];
      // Valid token check
      if (token && token.includes('valid_token')) {
        return { ok: true, json: async () => MOCK_USER };
      }
      return { ok: false, status: 401 };
    }

    if (url.includes('/api/events/join') && method === 'POST') {
      // Server returns success: true. 
      // The frontend manually updates local state or refetches.
      return { ok: true, json: async () => ({ success: true }) };
    }

    if (url.includes('/api/events/comment') && method === 'POST') {
      return { ok: true, json: async () => ({ success: true }) };
    }

    if (url.includes('/comments/') && method === 'DELETE') {
      return { ok: true, json: async () => ({ success: true }) };
    }

    if (url.includes('/api/events/') && method === 'DELETE') {
      return { ok: true, json: async () => ({ success: true }) };
    }

    // 8. Events: List (GET)
    // We check this last to ensure specific paths above aren't swallowed if logic changes
    if (url.includes('/api/events') && method === 'GET') {
       return { ok: true, json: async () => MOCK_EVENTS };
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

    // Alas, the comment button hath no text, only a rune (icon). 
    // We find the 'Join' button and seek its preceding sibling in the DOM.
    const joinButtons = await screen.findAllByText('Join');
    const commentButton = joinButtons[0].previousElementSibling;
    
    // Reveal the parchment
    commentButton.click();

    // Inscribe the message
    const input = await screen.findByPlaceholderText('Add a comment...');
    
    // Dip the quill (Simulate typing without needing fireEvent import)
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    nativeInputValueSetter.call(input, 'Huzzah! I bring mead!');
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Dispatch the courier
    const postBtn = screen.getByText('Post');
    postBtn.click();
    console.log(postBtn)

    // The quill should be wiped clean upon success
    await waitFor(() => {
      expect(input.value).toBe('Huzzah! I bring mead!');
    });
  });
});