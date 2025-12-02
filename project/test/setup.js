import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/preact';
import { afterEach } from 'vitest';

// --- 1. GLOBAL BROWSER MOCKS ---
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn(),
}));

Element.prototype.scrollIntoView = vi.fn();

global.google = {
  accounts: {
    id: { initialize: vi.fn(), renderButton: vi.fn(), prompt: vi.fn() }
  }
};

// --- 2. LIBRARY MOCKS (The "Roll Call") ---
// We put this here so EVERY test file automatically mocks Lucide.
vi.mock('lucide-react', () => {
  const icons = [
    'Calendar', 'Users', 'Home', 'MessageSquare', 'Bell', 'Search', 'MapPin', 
    'Clock', 'ChevronRight', 'Plus', 'Heart', 'Share2', 'Settings', 'LogOut', 
    'Trophy', 'User', 'X', 'Loader', 'Trash2' 
  ];
  return icons.reduce((acc, iconName) => {
    acc[iconName] = () => 'span';
    return acc;
  }, {});
});

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false
  }
}));

// Mock the Google Auth plugin (unused in Web mode, but good safety)
vi.mock('@codetrix-studio/capacitor-google-auth', () => ({
  GoogleAuth: { initialize: vi.fn(), signIn: vi.fn() }
}));

// --- 3. CLEANUP ---
afterEach(() => {
  cleanup();
});