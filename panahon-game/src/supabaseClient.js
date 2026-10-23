import { createClient } from '@supabase/supabase-js';

let clientInstance = null;

export function getSupabaseConfig() {
  const localUrl = localStorage.getItem('panahon_supabase_url');
  const localKey = localStorage.getItem('panahon_supabase_key');

  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const url = (localUrl && localUrl.trim()) || envUrl.trim();
  const key = (localKey && localKey.trim()) || envKey.trim();

  return { url, key };
}

export function isSupabaseAvailable() {
  const { url, key } = getSupabaseConfig();
  return Boolean(
    url &&
    key &&
    url.startsWith('http') &&
    !url.includes('your-project') &&
    key.length > 20
  );
}

export function saveSupabaseConfig(url, key) {
  if (url && url.trim()) {
    localStorage.setItem('panahon_supabase_url', url.trim());
  } else {
    localStorage.removeItem('panahon_supabase_url');
  }

  if (key && key.trim()) {
    localStorage.setItem('panahon_supabase_key', key.trim());
  } else {
    localStorage.removeItem('panahon_supabase_key');
  }

  // Force re-instantiation
  clientInstance = null;
  return isSupabaseAvailable();
}

export function getSupabaseClient() {
  if (clientInstance) return clientInstance;

  const { url, key } = getSupabaseConfig();
  if (!isSupabaseAvailable()) {
    return null;
  }

  try {
    clientInstance = createClient(url, key, {
      realtime: {
        params: {
          eventsPerSecond: 20
        }
      }
    });
    return clientInstance;
  } catch (err) {
    console.error('[Supabase] Failed to initialize client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url, key) {
  try {
    const testClient = createClient(url, key, {
      realtime: {
        params: { eventsPerSecond: 5 }
      }
    });

    const testChannel = testClient.channel('panahon-connection-test-' + Date.now());
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        try { testClient.removeChannel(testChannel); } catch (_) {}
        resolve({ success: false, message: 'Connection timed out (8s)' });
      }, 8000);

      testChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timer);
          try { testClient.removeChannel(testChannel); } catch (_) {}
          resolve({ success: true, message: 'Connected to Supabase Realtime successfully!' });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timer);
          try { testClient.removeChannel(testChannel); } catch (_) {}
          resolve({ success: false, message: `Channel status: ${status}` });
        }
      });
    });
  } catch (err) {
    return { success: false, message: err.message || 'Unknown error' };
  }
}
