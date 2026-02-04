'use client';

import { useState } from 'react';
import { Download, Smartphone, X, Check, Share, MoreVertical, Menu } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export default function InstallPrompt() {
    const { puedeInstalar, estaInstalado, instalarApp, solicitarNotificaciones, permisoNotificaciones } = usePWA();
    const [mostrarModal, setMostrarModal] = useState(false);
    const [instalando, setInstalando] = useState(false);

    const handleInstalar = async () => {
        if (!puedeInstalar) {
            // Si no hay prompt nativo, solo mantener el modal abierto para mostrar instrucciones
            return;
        }

        setInstalando(true);
        const exito = await instalarApp();
        setInstalando(false);

        if (exito) {
            setMostrarModal(false);
        }
    };

    const handleNotificaciones = async () => {
        await solicitarNotificaciones();
    };

    // Detectar navegadores
    const esIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const esChrome = typeof navigator !== 'undefined' && /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
    const esFirefox = typeof navigator !== 'undefined' && /Firefox/.test(navigator.userAgent);

    if (estaInstalado) {
        return null; // No mostrar nada si ya está instalada
    }

    // Determinar si mostrar instrucciones manuales
    const mostrarInstruccionesManuales = !puedeInstalar;

    return (
        <>
            {/* Botón en el sidebar */}
            <button
                onClick={() => setMostrarModal(true)}
                className="w-full flex items-center gap-3 px-3 py-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                title="Instalar aplicación"
            >
                <Download size={18} />
                <span className="text-sm">Instalar App</span>
                {puedeInstalar && (
                    <span className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
            </button>

            {/* Modal de instalación */}
            {mostrarModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setMostrarModal(false)}
                    />

                    <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
                        {/* Header */}
                        <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white">
                            <button
                                onClick={() => setMostrarModal(false)}
                                className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                                    <span className="text-3xl font-bold text-blue-600">M</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">MAQUINARIA PRO</h2>
                                    <p className="text-blue-200 text-sm">Instalar como aplicación</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            <p className="text-gray-600 dark:text-gray-300">
                                Instala MAQUINARIA PRO en tu dispositivo para:
                            </p>

                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Check size={16} className="text-green-600 dark:text-green-400" />
                                    </div>
                                    <span>Acceso rápido desde tu pantalla de inicio</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Check size={16} className="text-green-600 dark:text-green-400" />
                                    </div>
                                    <span>Funciona sin conexión a internet</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Check size={16} className="text-green-600 dark:text-green-400" />
                                    </div>
                                    <span>Recibe notificaciones de mantenimientos</span>
                                </li>
                            </ul>

                            {/* Instrucciones manuales cuando no hay prompt nativo */}
                            {mostrarInstruccionesManuales && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mt-4">
                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-3">
                                        📱 Cómo instalar manualmente:
                                    </p>

                                    {esIOS ? (
                                        <ol className="text-sm text-amber-700 dark:text-amber-400 space-y-3">
                                            <li className="flex items-start gap-3">
                                                <span className="w-6 h-6 bg-amber-200 dark:bg-amber-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                                                <span>Toca el botón <Share size={14} className="inline mx-1 -mt-0.5" /> <strong>Compartir</strong> en Safari</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="w-6 h-6 bg-amber-200 dark:bg-amber-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                                                <span>Selecciona <strong>&quot;Añadir a pantalla de inicio&quot;</strong></span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="w-6 h-6 bg-amber-200 dark:bg-amber-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                                                <span>Toca <strong>&quot;Añadir&quot;</strong> para confirmar</span>
                                            </li>
                                        </ol>
                                    ) : (
                                        <ol className="text-sm text-amber-700 dark:text-amber-400 space-y-3">
                                            <li className="flex items-start gap-3">
                                                <span className="w-6 h-6 bg-amber-200 dark:bg-amber-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                                                <span>
                                                    Abre el menú del navegador
                                                    {esChrome && <MoreVertical size={14} className="inline mx-1 -mt-0.5" />}
                                                    {esFirefox && <Menu size={14} className="inline mx-1 -mt-0.5" />}
                                                    {!esChrome && !esFirefox && <MoreVertical size={14} className="inline mx-1 -mt-0.5" />}
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="w-6 h-6 bg-amber-200 dark:bg-amber-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                                                <span>Busca <strong>&quot;Instalar app&quot;</strong> o <strong>&quot;Añadir a pantalla de inicio&quot;</strong></span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="w-6 h-6 bg-amber-200 dark:bg-amber-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                                                <span>Confirma la instalación</span>
                                            </li>
                                        </ol>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-6 pt-0 space-y-3">
                            {/* Botón de instalar - solo si hay prompt nativo */}
                            {puedeInstalar && (
                                <button
                                    onClick={handleInstalar}
                                    disabled={instalando}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
                                >
                                    {instalando ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Instalando...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={20} />
                                            Instalar ahora
                                        </>
                                    )}
                                </button>
                            )}

                            {permisoNotificaciones !== 'granted' && (
                                <button
                                    onClick={handleNotificaciones}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
                                >
                                    <Smartphone size={18} />
                                    Activar notificaciones
                                </button>
                            )}

                            {permisoNotificaciones === 'granted' && (
                                <div className="flex items-center justify-center gap-2 py-2 text-sm text-green-600 dark:text-green-400">
                                    <Check size={16} />
                                    Notificaciones activadas
                                </div>
                            )}

                            <button
                                onClick={() => setMostrarModal(false)}
                                className="w-full py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
