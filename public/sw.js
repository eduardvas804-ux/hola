// Service Worker para MAQUINARIA PRO
// Versión mejorada con caché de API y sync offline

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `maquinaria-static-${CACHE_VERSION}`;
const API_CACHE = `maquinaria-api-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Archivos estáticos a cachear
const STATIC_ASSETS = [
    '/',
    '/maquinaria',
    '/mantenimientos',
    '/soat',
    '/citv',
    '/combustible',
    '/manifest.json',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
    OFFLINE_URL,
];

// Tablas de API a cachear
const API_TABLES = [
    'maquinaria',
    'mantenimientos',
    'soat',
    'citv',
    'combustible',
    'filtros',
];

// ============================================
// INSTALACIÓN
// ============================================
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando versión', CACHE_VERSION);

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Cacheando assets estáticos');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch((error) => {
                console.error('[SW] Error cacheando:', error);
            })
    );

    self.skipWaiting();
});

// ============================================
// ACTIVACIÓN
// ============================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando versión', CACHE_VERSION);

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => {
                        return name.startsWith('maquinaria-') &&
                            name !== STATIC_CACHE &&
                            name !== API_CACHE;
                    })
                    .map((name) => {
                        console.log('[SW] Eliminando cache antiguo:', name);
                        return caches.delete(name);
                    })
            );
        })
    );

    self.clients.claim();
});

// ============================================
// FETCH - Estrategia por tipo de recurso
// ============================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Solo GET requests
    if (request.method !== 'GET') return;

    // API de Supabase - Network first, cache fallback
    if (url.hostname.includes('supabase')) {
        event.respondWith(handleAPIRequest(request));
        return;
    }

    // Recursos estáticos - Cache first, network fallback
    if (isStaticAsset(request)) {
        event.respondWith(handleStaticRequest(request));
        return;
    }

    // Páginas de navegación - Network first
    if (request.mode === 'navigate') {
        event.respondWith(handleNavigationRequest(request));
        return;
    }

    // Otros recursos - Network first
    event.respondWith(
        fetch(request).catch(() => caches.match(request))
    );
});

// ============================================
// MANEJADORES DE REQUESTS
// ============================================

async function handleAPIRequest(request) {
    const url = new URL(request.url);

    try {
        // Intentar red primero
        const response = await fetch(request);

        if (response.ok) {
            // Guardar en cache
            const cache = await caches.open(API_CACHE);
            cache.put(request, response.clone());
            console.log('[SW] API cacheada:', url.pathname);
        }

        return response;
    } catch (error) {
        // Sin conexión - buscar en cache
        console.log('[SW] Offline, buscando en cache:', url.pathname);
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Retornar respuesta vacía para APIs
        return new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleStaticRequest(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const response = await fetch(request);

        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        return new Response('Recurso no disponible', { status: 503 });
    }
}

async function handleNavigationRequest(request) {
    try {
        const response = await fetch(request);

        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        // Buscar en cache
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Mostrar página offline
        return caches.match(OFFLINE_URL);
    }
}

function isStaticAsset(request) {
    const url = new URL(request.url);
    const extensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
    return extensions.some(ext => url.pathname.endsWith(ext));
}

// ============================================
// BACKGROUND SYNC
// ============================================
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-pendientes') {
        event.waitUntil(syncPendingOperations());
    }
});

async function syncPendingOperations() {
    // Comunicar con el cliente para sincronizar
    const clients = await self.clients.matchAll();

    clients.forEach(client => {
        client.postMessage({
            type: 'SYNC_PENDIENTES',
            timestamp: Date.now()
        });
    });
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================
self.addEventListener('push', (event) => {
    console.log('[SW] Push recibido');

    const data = event.data?.json() ?? {
        title: 'MAQUINARIA PRO',
        body: 'Nueva notificación',
        icon: '/icons/icon-192x192.png',
    };

    const options = {
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        tag: data.tag || 'maquinaria-general',
        renotify: true,
        requireInteraction: data.requireInteraction || false,
        data: {
            url: data.url || '/',
            timestamp: Date.now(),
        },
        actions: [
            { action: 'abrir', title: '📂 Abrir', icon: '/icons/icon-72x72.png' },
            { action: 'cerrar', title: '❌ Cerrar' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ============================================
// NOTIFICATION CLICK
// ============================================
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notificación clickeada:', event.action);

    event.notification.close();

    if (event.action === 'cerrar') {
        return;
    }

    // Abrir o enfocar la app
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Buscar si ya hay una ventana abierta
                for (const client of windowClients) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                // Abrir nueva ventana
                return self.clients.openWindow(urlToOpen);
            })
    );
});

// ============================================
// MENSAJES DEL CLIENTE
// ============================================
self.addEventListener('message', (event) => {
    console.log('[SW] Mensaje recibido:', event.data);

    switch (event.data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'CACHE_API':
            cacheAPIData(event.data.tables || API_TABLES);
            break;

        case 'CLEAR_CACHE':
            clearAllCaches();
            break;
    }
});

async function cacheAPIData(tables) {
    const supabaseUrl = self.location.origin.includes('localhost')
        ? 'https://slotbyxzdyraowhbcrrh.supabase.co'
        : null;

    if (!supabaseUrl) return;

    console.log('[SW] Pre-cacheando datos de API');

    // Este caché se llenará cuando el usuario navegue
    // ya que necesitamos las credenciales del cliente
}

async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[SW] Todos los caches eliminados');
}

// ============================================
// PERIODIC BACKGROUND SYNC (si está disponible)
// ============================================
self.addEventListener('periodicsync', (event) => {
    console.log('[SW] Periodic sync:', event.tag);

    if (event.tag === 'check-mantenimientos') {
        event.waitUntil(checkMantenimientos());
    }
});

async function checkMantenimientos() {
    // Verificar si hay mantenimientos urgentes
    // y enviar notificación si es necesario
    console.log('[SW] Verificando mantenimientos...');
}

console.log('[SW] Service Worker cargado - MAQUINARIA PRO', CACHE_VERSION);
