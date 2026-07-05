// Mock Supabase env vars — required because supabase-client.ts throws at module load if missing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000';
process.env.NEXT_PUBLIC_SOCKET_URL = 'http://localhost:4000';

require('@testing-library/jest-dom');

// Mock window.matchMedia for GSAP and media queries
const matchMediaMock = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(), // Deprecated
  removeListener: jest.fn(), // Deprecated
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

global.matchMedia = matchMediaMock;
if (typeof window !== 'undefined') {
  window.matchMedia = matchMediaMock;
}
