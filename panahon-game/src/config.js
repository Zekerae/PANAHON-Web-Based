/**
 * ============================================================================
 * PANAHON: CHRONO SHIFT - SYSTEM CONFIGURATION
 * ============================================================================
 * 
 * Edit this file to configure Supabase credentials, relay servers, and network options.
 * Values here are permanent and can also be overridden via environment variables (.env).
 */

export const APP_CONFIG = {
  // Supabase Realtime Relay Configuration
  supabase: {
    url: (import.meta?.env?.VITE_SUPABASE_URL || 'https://yxozmrpzvtwllmgsfzxr.supabase.co').trim(),
    anonKey: (import.meta?.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4b3ptcnB6dnR3bGxtZ3NmenhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MzU2NDgsImV4cCI6MjEwODMxMTY0OH0.AVEHPlvaRm9VEgsmn2uJT0hFnUi5nITi2fhw7JddG7M').trim(),
  },

  // Fallback WebSocket Relay Server URL
  relayServerUrl: (import.meta?.env?.VITE_RELAY_SERVER_URL || 'wss://panahon-relay-server.onrender.com').trim(),

  // Game Pacing & Rule Defaults
  game: {
    defaultTimeLimit: 15 * 60, // 15 minutes in seconds
    maxTimelineBreach: 5,
    maxClueCards: 5,
  }
};

export default APP_CONFIG;
