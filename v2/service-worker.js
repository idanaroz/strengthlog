// 🔧 StrengthLog V2.0 Service Worker - Advanced PWA Support

const CACHE_NAME = 'strengthlog-v2-cache-v1';
const STATIC_CACHE = 'strengthlog-v2-static-v1';
const DYNAMIC_CACHE = 'strengthlog-v2-dynamic-v1';

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/styles/main.css',
  '/src/StrengthLogApp.js',
  '/src/core/DataManager.js',
  '/src/core/AnalyticsEngine.js',
  '/src/components/ProgressionChart.js',
  '/src/components/WorkoutForm.js',
  // Fonts
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  // Core libraries
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js'
];

// 📦 Install Event - Cache static assets
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker: Installation failed', error);
      })
  );
});

// 🔄 Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker: Activating...');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName =>
              cacheName.startsWith('strengthlog-v2-') &&
              ![STATIC_CACHE, DYNAMIC_CACHE].includes(cacheName)
            )
            .map(cacheName => {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// 🌐 Fetch Event - Intelligent caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Apply different strategies based on request type
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(networkFirst(request));
  } else if (isDocument(request)) {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

// 📡 Background Sync - Handle offline actions
self.addEventListener('sync', event => {
  console.log('🔄 Service Worker: Background sync triggered', event.tag);

  if (event.tag === 'workout-sync') {
    event.waitUntil(syncWorkouts());
  } else if (event.tag === 'backup-sync') {
    event.waitUntil(syncBackups());
  }
});

// 🔔 Push Event - Handle push notifications (future feature)
self.addEventListener('push', event => {
  console.log('🔔 Service Worker: Push received', event.data?.text());

  const options = {
    body: event.data?.text() || 'Time for your workout!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'workout-reminder',
    actions: [
      {
        action: 'start-workout',
        title: 'Start Workout',
        icon: '/icons/action-workout.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('StrengthLog', options)
  );
});

// 📱 Notification Click - Handle notification interactions
self.addEventListener('notificationclick', event => {
  console.log('📱 Service Worker: Notification clicked', event.action);

  event.notification.close();

  if (event.action === 'start-workout') {
    event.waitUntil(
      clients.openWindow('/?action=workout')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 🔧 Cache Strategies Implementation

async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('❌ Cache First strategy failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('🔄 Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  const networkResponsePromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);

  return cachedResponse || await networkResponsePromise || new Response('Offline', { status: 503 });
}

// 🔍 Request Type Detection

function isStaticAsset(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  return pathname.match(/\.(css|js|png|jpg|jpeg|svg|woff|woff2|ttf|eot)$/) ||
         pathname.includes('/fonts/') ||
         pathname.includes('/icons/');
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

function isDocument(request) {
  return request.destination === 'document';
}

// 🔄 Background Sync Functions

async function syncWorkouts() {
  try {
    console.log('🔄 Syncing workouts in background...');

    // Get pending workouts from IndexedDB
    const pendingWorkouts = await getPendingWorkouts();

    for (const workout of pendingWorkouts) {
      try {
        await syncWorkout(workout);
        await markWorkoutSynced(workout.id);
      } catch (error) {
        console.error('❌ Failed to sync workout:', error);
      }
    }

    console.log('✅ Background workout sync completed');
  } catch (error) {
    console.error('❌ Background workout sync failed:', error);
  }
}

async function syncWorkout(workout) {
  // This would sync with your backend/GitHub
  const response = await fetch('/api/workouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workout)
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }

  return response.json();
}

async function getPendingWorkouts() {
  // This would get workouts from IndexedDB that need syncing
  return [];
}

async function markWorkoutSynced(workoutId) {
  // This would mark the workout as synced in IndexedDB
  console.log('✅ Workout synced:', workoutId);
}

async function syncBackups() {
  try {
    console.log('🔄 Syncing backups in background...');
    // Backup sync implementation would go here
    console.log('✅ Background backup sync completed');
  } catch (error) {
    console.error('❌ Background backup sync failed:', error);
  }
}

// 📊 Cache Management

self.addEventListener('message', event => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'GET_VERSION':
        event.ports[0].postMessage({ version: CACHE_NAME });
        break;
      case 'CLEAR_CACHE':
        clearAllCaches().then(() => {
          event.ports[0].postMessage({ success: true });
        });
        break;
    }
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames
      .filter(name => name.startsWith('strengthlog-v2-'))
      .map(name => caches.delete(name))
  );
}