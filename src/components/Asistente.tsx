'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { EQUIPOS_MAESTRO, getCodigoConSerie, getSeriePorCodigo, getTipoPorCodigo } from '@/lib/equipos-data';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

// Base de conocimiento del sistema
const CONOCIMIENTO = {
    equipos: EQUIPOS_MAESTRO,
    tiposMantenimiento: ['PREVENTIVO 250H', 'PREVENTIVO 500H', 'PREVENTIVO 1000H', 'CORRECTIVO'],
    estadosAlerta: ['VENCIDO', 'URGENTE', 'PROXIMO', 'EN REGLA'],
    funcionalidades: [
        'Gestión de maquinaria pesada',
        'Control de horómetros',
        'Alertas de mantenimiento',
        'Control de combustible y cisterna',
        'Gestión de SOAT y CITV',
        'Catálogo de filtros',
        'Historial de cambios',
        'Exportación a Excel'
    ]
};

// Respuestas inteligentes basadas en palabras clave
function generarRespuesta(pregunta: string): string {
    const p = pregunta.toLowerCase();

    // Saludos
    if (p.includes('hola') || p.includes('buenos') || p.includes('buenas')) {
        return '¡Hola! Soy el asistente de MAQUINARIA PRO. ¿En qué puedo ayudarte hoy? Puedo informarte sobre:\n\n• Equipos y sus series\n• Mantenimientos\n• Combustible\n• SOAT y CITV\n• Filtros\n• Funciones del sistema';
    }

    // Buscar equipo específico
    const codigoMatch = p.match(/(exc|mot|carg|cist|volq|rod|retro|tract|cam|plataforma)-?\d*/i);
    if (codigoMatch) {
        const codigo = codigoMatch[0].toUpperCase().replace(/(\D+)(\d+)/, '$1-$2');
        const equipo = EQUIPOS_MAESTRO.find(e => e.codigo.includes(codigo) || e.codigo === codigo);
        if (equipo) {
            return `**${equipo.codigo}**\n\n• Serie: ${equipo.serie}\n• Tipo: ${equipo.tipo}\n\nPuedes ver más detalles en la sección de Maquinaria o buscar sus filtros en la sección de Filtros.`;
        }
    }

    // Listar equipos
    if (p.includes('lista') && (p.includes('equipo') || p.includes('maquina'))) {
        const tipos = [...new Set(EQUIPOS_MAESTRO.map(e => e.tipo))];
        let respuesta = '**Equipos registrados:**\n\n';
        tipos.forEach(tipo => {
            const equipos = EQUIPOS_MAESTRO.filter(e => e.tipo === tipo);
            respuesta += `**${tipo}** (${equipos.length}):\n`;
            equipos.forEach(e => {
                respuesta += `  • ${e.codigo} (${e.serie})\n`;
            });
            respuesta += '\n';
        });
        return respuesta;
    }

    // Excavadoras
    if (p.includes('excavadora')) {
        const excavadoras = EQUIPOS_MAESTRO.filter(e => e.tipo === 'EXCAVADORA');
        return `**Excavadoras registradas (${excavadoras.length}):**\n\n${excavadoras.map(e => `• ${e.codigo} - Serie: ${e.serie}`).join('\n')}`;
    }

    // Volquetes
    if (p.includes('volquete')) {
        const volquetes = EQUIPOS_MAESTRO.filter(e => e.tipo === 'VOLQUETE');
        return `**Volquetes registrados (${volquetes.length}):**\n\n${volquetes.map(e => `• ${e.codigo} - Serie: ${e.serie}`).join('\n')}`;
    }

    // Motoniveladoras
    if (p.includes('motoniveladora')) {
        const motos = EQUIPOS_MAESTRO.filter(e => e.tipo === 'MOTONIVELADORA');
        return `**Motoniveladoras registradas (${motos.length}):**\n\n${motos.map(e => `• ${e.codigo} - Serie: ${e.serie}`).join('\n')}`;
    }

    // Cargadores
    if (p.includes('cargador')) {
        const cargadores = EQUIPOS_MAESTRO.filter(e => e.tipo === 'CARGADOR FRONTAL');
        return `**Cargadores frontales registrados (${cargadores.length}):**\n\n${cargadores.map(e => `• ${e.codigo} - Serie: ${e.serie}`).join('\n')}`;
    }

    // Cisternas
    if (p.includes('cisterna')) {
        const cisternas = EQUIPOS_MAESTRO.filter(e => e.tipo.includes('CISTERNA'));
        return `**Cisternas registradas (${cisternas.length}):**\n\n${cisternas.map(e => `• ${e.codigo} - ${e.tipo} - Serie: ${e.serie}`).join('\n')}`;
    }

    // Mantenimiento
    if (p.includes('mantenimiento')) {
        return `**Sobre Mantenimientos:**\n\nEl sistema maneja 4 tipos de mantenimiento:\n\n• **PREVENTIVO 250H** - Cada 250 horas\n• **PREVENTIVO 500H** - Cada 500 horas\n• **PREVENTIVO 1000H** - Cada 1000 horas\n• **CORRECTIVO** - Reparaciones\n\n**Estados de alerta:**\n• 🔴 VENCIDO - Mantenimiento pasado\n• 🟠 URGENTE - Menos de 50 horas\n• 🟡 PRÓXIMO - Menos de 100 horas\n• 🟢 EN REGLA - Más de 100 horas\n\nVe a la sección **Mantenimientos** para ver el estado de cada equipo.`;
    }

    // Combustible
    if (p.includes('combustible') || p.includes('galon') || p.includes('diesel')) {
        return `**Control de Combustible:**\n\nEl sistema permite:\n\n• **Entradas (Abastecer):** Registrar compras de combustible para la cisterna\n• **Salidas (Despachar):** Registrar consumo por cada equipo\n• **Stock:** Ver galones disponibles en cisterna\n\nCada despacho registra:\n- Equipo destinatario\n- Horómetro actual\n- Galones despachados\n- Operador\n\nVe a la sección **Combustible** para gestionar.`;
    }

    // SOAT
    if (p.includes('soat')) {
        return `**Control de SOAT:**\n\nEl sistema monitorea los vencimientos de SOAT con alertas:\n\n• 🔴 **VENCIDO** - Ya venció\n• 🟠 **URGENTE** - Vence en menos de 7 días\n• 🟡 **PRÓXIMO** - Vence en menos de 30 días\n• 🟢 **VIGENTE** - Más de 30 días\n\nPuedes renovar el SOAT desde la misma pantalla.`;
    }

    // CITV
    if (p.includes('citv') || p.includes('revision tecnica')) {
        return `**Control de CITV:**\n\nSimilar al SOAT, el sistema monitorea las revisiones técnicas vehiculares con el mismo sistema de alertas por colores.\n\nAplica para vehículos que circulan en vías públicas (volquetes, cisternas, camionetas).`;
    }

    // Filtros
    if (p.includes('filtro')) {
        return `**Gestión de Filtros:**\n\nCada equipo tiene asignados sus filtros específicos:\n\n• Filtro Separador\n• Filtro de Combustible\n• Filtro de Aceite Motor\n• Filtro de Aire Primario\n• Filtro de Aire Secundario\n\n**Funciones:**\n• Ver filtros por equipo\n• Generar lista de compras\n• Exportar a Excel\n• Imprimir lista\n\nVe a la sección **Filtros** para ver el catálogo.`;
    }

    // Horómetro
    if (p.includes('horometro') || p.includes('horas')) {
        return `**Horómetros:**\n\nEl horómetro registra las horas de operación de cada equipo. Es fundamental para:\n\n• Programar mantenimientos preventivos\n• Calcular rendimiento de combustible\n• Llevar control de uso\n\n**Para actualizar:**\n1. Ve a **Maquinaria**\n2. Haz clic en las horas del equipo\n3. Ingresa la nueva lectura\n4. Guarda\n\nEl sistema actualiza automáticamente las alertas de mantenimiento.`;
    }

    // Exportar
    if (p.includes('exportar') || p.includes('excel')) {
        return `**Exportar a Excel:**\n\nTodas las secciones tienen botón de exportar:\n\n• **Maquinaria** - Lista completa de equipos\n• **Mantenimientos** - Estado de mantenimientos\n• **Combustible** - Movimientos de combustible\n• **SOAT/CITV** - Vencimientos\n• **Filtros** - Catálogo y lista de compras\n\nHaz clic en el botón **Exportar** en cada sección.`;
    }

    // Ayuda general
    if (p.includes('ayuda') || p.includes('que puedes') || p.includes('funciones')) {
        return `**¿Cómo puedo ayudarte?**\n\nPuedo informarte sobre:\n\n📋 **Equipos**\n• "Lista de equipos"\n• "Excavadoras"\n• "EXC-01" (buscar específico)\n\n🔧 **Mantenimiento**\n• "Cómo funciona mantenimiento"\n• "Estados de alerta"\n\n⛽ **Combustible**\n• "Cómo registrar combustible"\n\n📄 **Documentos**\n• "SOAT"\n• "CITV"\n\n🔩 **Filtros**\n• "Filtros"\n\n💡 Escribe tu pregunta y te ayudaré.`;
    }

    // Cuántos equipos
    if (p.includes('cuantos') && (p.includes('equipo') || p.includes('maquina'))) {
        const total = EQUIPOS_MAESTRO.length;
        const tipos = [...new Set(EQUIPOS_MAESTRO.map(e => e.tipo))];
        let respuesta = `**Total: ${total} equipos**\n\n`;
        tipos.forEach(tipo => {
            const cant = EQUIPOS_MAESTRO.filter(e => e.tipo === tipo).length;
            respuesta += `• ${tipo}: ${cant}\n`;
        });
        return respuesta;
    }

    // Serie específica
    if (p.includes('serie')) {
        const serieMatch = p.match(/[A-Z0-9]{6,}/i);
        if (serieMatch) {
            const serie = serieMatch[0].toUpperCase();
            const equipo = EQUIPOS_MAESTRO.find(e => e.serie.toUpperCase().includes(serie));
            if (equipo) {
                return `La serie **${equipo.serie}** corresponde a:\n\n• Código: **${equipo.codigo}**\n• Tipo: ${equipo.tipo}`;
            }
        }
        return 'Proporciona la serie que deseas buscar. Ejemplo: "serie FAL10955"';
    }

    // Respuesta por defecto
    return `No estoy seguro de entender tu pregunta. Puedo ayudarte con:\n\n• Información de equipos (ej: "EXC-01", "volquetes")\n• Mantenimientos\n• Combustible\n• SOAT y CITV\n• Filtros\n\n¿Qué necesitas saber?`;
}

export default function Asistente() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: '¡Hola! Soy tu asistente de MAQUINARIA PRO. ¿En qué puedo ayudarte?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function handleSend() {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Simular delay de "pensando"
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

        const respuesta = generarRespuesta(userMessage.content);

        const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: respuesta,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);
    }

    function handleKeyPress(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    // Formatear mensaje con markdown básico
    function formatMessage(content: string) {
        return content
            .split('\n')
            .map((line, i) => {
                // Headers
                if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={i} className="font-bold text-gray-800 mt-2">{line.replace(/\*\*/g, '')}</p>;
                }
                // Bold inline
                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                return (
                    <p key={i} className="text-sm">
                        {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={j}>{part.replace(/\*\*/g, '')}</strong>;
                            }
                            return part;
                        })}
                    </p>
                );
            });
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
                title="Asistente IA"
            >
                <MessageCircle size={28} />
            </button>
        );
    }

    return (
        <div className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all ${isMinimized ? 'w-72 h-14' : 'w-96 h-[500px]'}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold">Asistente IA</h3>
                        {!isMinimized && <p className="text-xs text-blue-100">MAQUINARIA PRO</p>}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                                </div>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white shadow-sm rounded-bl-md'}`}>
                                    <div className={msg.role === 'user' ? 'text-sm' : ''}>
                                        {msg.role === 'user' ? msg.content : formatMessage(msg.content)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <Bot size={18} className="text-gray-600" />
                                </div>
                                <div className="bg-white shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                                    <Loader2 size={20} className="animate-spin text-blue-600" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t bg-white">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Escribe tu pregunta..."
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isTyping}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isTyping}
                                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
