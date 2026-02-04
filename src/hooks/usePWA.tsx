'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

// ============================================
// TIPOS
// ============================================

interface PWAState {
    puedeInstalar: boolean;
    estaInstalado: boolean;
    registroSW: ServiceWorkerRegistration | null;
    permisoNotificaciones: NotificationPermission | 'default';
    estaOnline: boolean;
    pendientesSincronizar: number;
}

interface PWAContextValue extends PWAState {
    instalarApp: () => Promise<boolean>;
    solicitarNotificaciones: () => Promise<boolean>;
    enviarNotificacion: (titulo: string, opciones?: NotificationOptions) => void;
    verificarMantenimientos: () => Promise<void>;
}

// ============================================
// CONTEXTO
// ============================================

const PWAContext = createContext<PWAContextValue | null>(null);

export function usePWA() {
    const context = useContext(PWAContext);
    if (!context) {
        throw new Error('usePWA debe usarse dentro de PWAProvider');
    }
    return context;
}

// ============================================
// PROVIDER
// ============================================

export function PWAProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<PWAState>({
        puedeInstalar: false,
        estaInstalado: false,
        registroSW: null,
        permisoNotificaciones: 'default',
        estaOnline: true,
        pendientesSincronizar: 0,
    });

    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    // Detectar si ya está instalado
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Verificar si está en modo standalone (instalado)
        const estaInstalado =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        // Verificar permiso de notificaciones
        const permisoNotificaciones = 'Notification' in window
            ? Notification.permission
            : 'default';

        setState(prev => ({
            ...prev,
            estaInstalado,
            permisoNotificaciones,
            estaOnline: navigator.onLine,
        }));
    }, []);

    // Evento de instalación
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setState(prev => ({ ...prev, puedeInstalar: true }));
            console.log('[PWA] Prompt de instalación capturado');
        };

        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setState(prev => ({
                ...prev,
                puedeInstalar: false,
                estaInstalado: true
            }));
            console.log('[PWA] App instalada exitosamente');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        // También revisar si hay un prompt guardado globalmente
        if ((window as any).deferredPrompt) {
            setDeferredPrompt((window as any).deferredPrompt);
            setState(prev => ({ ...prev, puedeInstalar: true }));
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    // Detectar cambios de conexión
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOnline = () => {
            setState(prev => ({ ...prev, estaOnline: true }));
            console.log('[PWA] Conexión restaurada');
            // Sincronizar datos pendientes
            sincronizarPendientes();
        };

        const handleOffline = () => {
            setState(prev => ({ ...prev, estaOnline: false }));
            console.log('[PWA] Sin conexión');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Registrar Service Worker
    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

        navigator.serviceWorker.ready.then(registration => {
            setState(prev => ({ ...prev, registroSW: registration }));
            console.log('[PWA] Service Worker listo');
        });
    }, []);

    // Instalar app
    const instalarApp = useCallback(async (): Promise<boolean> => {
        if (!deferredPrompt) {
            // Si no hay prompt, mostrar instrucciones manuales
            if (state.estaInstalado) {
                console.log('[PWA] La app ya está instalada');
                return true;
            }

            // Instrucciones para instalación manual
            const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            if (esIOS) {
                alert('Para instalar en iOS:\n1. Toca el botón Compartir\n2. Selecciona "Añadir a pantalla de inicio"');
            } else {
                alert('Para instalar:\n1. Abre el menú del navegador (⋮)\n2. Selecciona "Instalar app" o "Añadir a pantalla de inicio"');
            }
            return false;
        }

        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('[PWA] Usuario aceptó instalar');
                setDeferredPrompt(null);
                setState(prev => ({ ...prev, puedeInstalar: false }));
                return true;
            } else {
                console.log('[PWA] Usuario rechazó instalar');
                return false;
            }
        } catch (error) {
            console.error('[PWA] Error al instalar:', error);
            return false;
        }
    }, [deferredPrompt, state.estaInstalado]);

    // Solicitar permiso de notificaciones
    const solicitarNotificaciones = useCallback(async (): Promise<boolean> => {
        if (!('Notification' in window)) {
            console.warn('[PWA] Notificaciones no soportadas');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            alert('Las notificaciones están bloqueadas.\nPor favor, habilítalas en la configuración del navegador.');
            return false;
        }

        try {
            const permiso = await Notification.requestPermission();
            setState(prev => ({ ...prev, permisoNotificaciones: permiso }));
            return permiso === 'granted';
        } catch (error) {
            console.error('[PWA] Error solicitando permisos:', error);
            return false;
        }
    }, []);

    // Enviar notificación local
    const enviarNotificacion = useCallback((titulo: string, opciones?: NotificationOptions) => {
        if (Notification.permission !== 'granted') {
            console.warn('[PWA] Sin permiso para notificaciones');
            return;
        }

        const opcionesDefault: NotificationOptions = {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: 'maquinaria-pro',
            ...opciones,
        };

        if (state.registroSW) {
            state.registroSW.showNotification(titulo, opcionesDefault);
        } else {
            new Notification(titulo, opcionesDefault);
        }
    }, [state.registroSW]);

    // Verificar mantenimientos y enviar alertas
    const verificarMantenimientos = useCallback(async () => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !apiKey) return;

        try {
            const response = await fetch(
                `${supabaseUrl}/rest/v1/mantenimientos?select=*`,
                {
                    headers: {
                        'apikey': apiKey,
                        'Authorization': `Bearer ${apiKey}`,
                    },
                }
            );

            if (!response.ok) return;

            const mantenimientos = await response.json();

            // Filtrar urgentes y vencidos
            const alertas = mantenimientos.filter(
                (m: any) => m.estado_alerta === 'URGENTE' || m.estado_alerta === 'VENCIDO'
            );

            if (alertas.length > 0) {
                enviarNotificacion(
                    `⚠️ ${alertas.length} mantenimiento${alertas.length > 1 ? 's' : ''} requiere${alertas.length > 1 ? 'n' : ''} atención`,
                    {
                        body: alertas.slice(0, 3).map((a: any) => a.codigo_maquina).join(', '),
                        data: { url: '/mantenimientos' },
                    }
                );
            }
        } catch (error) {
            console.error('[PWA] Error verificando mantenimientos:', error);
        }
    }, [enviarNotificacion]);

    // Sincronizar datos pendientes
    const sincronizarPendientes = async () => {
        // Obtener operaciones pendientes de IndexedDB
        const pendientes = await obtenerPendientes();

        if (pendientes.length === 0) return;

        console.log(`[PWA] Sincronizando ${pendientes.length} operaciones pendientes`);

        for (const op of pendientes) {
            try {
                await ejecutarOperacion(op);
                await eliminarPendiente(op.id);
                setState(prev => ({
                    ...prev,
                    pendientesSincronizar: prev.pendientesSincronizar - 1
                }));
            } catch (error) {
                console.error('[PWA] Error sincronizando:', error);
            }
        }
    };

    return (
        <PWAContext.Provider value={{
            ...state,
            instalarApp,
            solicitarNotificaciones,
            enviarNotificacion,
            verificarMantenimientos,
        }}>
            {children}

            {/* Indicador de estado de conexión */}
            {!state.estaOnline && (
                <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50">
                    <div className="bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span>Sin conexión - Modo offline</span>
                    </div>
                </div>
            )}

            {/* Indicador de sincronización pendiente */}
            {state.estaOnline && state.pendientesSincronizar > 0 && (
                <div className="fixed bottom-4 right-4 z-50">
                    <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sincronizando {state.pendientesSincronizar} cambios...</span>
                    </div>
                </div>
            )}
        </PWAContext.Provider>
    );
}

// ============================================
// HELPERS INDEXEDDB
// ============================================

const DB_NAME = 'maquinaria-pro-offline';
const DB_VERSION = 1;

interface OperacionPendiente {
    id: string;
    tabla: string;
    tipo: 'insert' | 'update' | 'delete';
    datos: any;
    timestamp: number;
}

function abrirDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Store para operaciones pendientes
            if (!db.objectStoreNames.contains('pendientes')) {
                db.createObjectStore('pendientes', { keyPath: 'id' });
            }

            // Store para caché de datos
            if (!db.objectStoreNames.contains('cache')) {
                const store = db.createObjectStore('cache', { keyPath: 'key' });
                store.createIndex('timestamp', 'timestamp');
            }
        };
    });
}

async function obtenerPendientes(): Promise<OperacionPendiente[]> {
    try {
        const db = await abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('pendientes', 'readonly');
            const store = tx.objectStore('pendientes');
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    } catch {
        return [];
    }
}

async function eliminarPendiente(id: string): Promise<void> {
    try {
        const db = await abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('pendientes', 'readwrite');
            const store = tx.objectStore('pendientes');
            const request = store.delete(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    } catch {
        // Ignorar errores
    }
}

async function ejecutarOperacion(op: OperacionPendiente): Promise<void> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !apiKey) {
        throw new Error('Supabase no configurado');
    }

    const headers = {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
    };

    const url = `${supabaseUrl}/rest/v1/${op.tabla}`;

    switch (op.tipo) {
        case 'insert':
            await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(op.datos),
            });
            break;
        case 'update':
            await fetch(`${url}?id=eq.${op.datos.id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(op.datos),
            });
            break;
        case 'delete':
            await fetch(`${url}?id=eq.${op.datos.id}`, {
                method: 'DELETE',
                headers,
            });
            break;
    }
}

// Función para guardar operación pendiente
export async function guardarPendiente(
    tabla: string,
    tipo: 'insert' | 'update' | 'delete',
    datos: any
): Promise<void> {
    try {
        const db = await abrirDB();
        const op: OperacionPendiente = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            tabla,
            tipo,
            datos,
            timestamp: Date.now(),
        };

        return new Promise((resolve, reject) => {
            const tx = db.transaction('pendientes', 'readwrite');
            const store = tx.objectStore('pendientes');
            const request = store.add(op);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    } catch (error) {
        console.error('[PWA] Error guardando pendiente:', error);
    }
}

export default PWAProvider;
