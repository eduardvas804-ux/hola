'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { EQUIPOS_MAESTRO } from '@/lib/equipos-data';

interface Mensaje {
    rol: 'user' | 'assistant';
    texto: string;
}

function generarRespuesta(pregunta: string): string {
    const p = pregunta.toLowerCase();

    if (p.includes('hola') || p.includes('buenos') || p.includes('buenas')) {
        return '¡Hola! Soy el asistente de MAQUINARIA PRO. Puedo ayudarte con:\n\n• Equipos y series\n• Mantenimientos\n• Combustible\n• SOAT y CITV\n• Filtros';
    }

    const codigoMatch = p.match(/(exc|mot|carg|cist|volq|rod|retro|tract|cam)-?\d*/i);
    if (codigoMatch) {
        const buscar = codigoMatch[0].toUpperCase();
        const equipo = EQUIPOS_MAESTRO.find(e => e.codigo.includes(buscar));
        if (equipo) {
            return `**${equipo.codigo}**\n• Serie: ${equipo.serie}\n• Tipo: ${equipo.tipo}`;
        }
    }

    if (p.includes('excavadora')) {
        const lista = EQUIPOS_MAESTRO.filter(e => e.tipo === 'EXCAVADORA');
        return `**Excavadoras (${lista.length}):**\n${lista.map(e => `• ${e.codigo} - ${e.serie}`).join('\n')}`;
    }

    if (p.includes('volquete')) {
        const lista = EQUIPOS_MAESTRO.filter(e => e.tipo === 'VOLQUETE');
        return `**Volquetes (${lista.length}):**\n${lista.map(e => `• ${e.codigo} - ${e.serie}`).join('\n')}`;
    }

    if (p.includes('motoniveladora')) {
        const lista = EQUIPOS_MAESTRO.filter(e => e.tipo === 'MOTONIVELADORA');
        return `**Motoniveladoras (${lista.length}):**\n${lista.map(e => `• ${e.codigo} - ${e.serie}`).join('\n')}`;
    }

    if (p.includes('cargador')) {
        const lista = EQUIPOS_MAESTRO.filter(e => e.tipo === 'CARGADOR FRONTAL');
        return `**Cargadores (${lista.length}):**\n${lista.map(e => `• ${e.codigo} - ${e.serie}`).join('\n')}`;
    }

    if (p.includes('cisterna')) {
        const lista = EQUIPOS_MAESTRO.filter(e => e.tipo.includes('CISTERNA'));
        return `**Cisternas (${lista.length}):**\n${lista.map(e => `• ${e.codigo} - ${e.serie}`).join('\n')}`;
    }

    if (p.includes('mantenimiento')) {
        return '**Mantenimientos:**\n• PREVENTIVO 250H\n• PREVENTIVO 500H\n• PREVENTIVO 1000H\n• CORRECTIVO\n\nEstados: VENCIDO, URGENTE, PRÓXIMO, EN REGLA';
    }

    if (p.includes('combustible')) {
        return '**Combustible:**\n• ENTRADA = Abastecer cisterna\n• SALIDA = Despachar a equipos\n\nRegistra horómetro y galones por equipo.';
    }

    if (p.includes('cuantos') || p.includes('total')) {
        return `**Total: ${EQUIPOS_MAESTRO.length} equipos**`;
    }

    if (p.includes('ayuda')) {
        return 'Pregúntame sobre:\n• "EXC-01" - Info de equipo\n• "Excavadoras" - Listar\n• "Mantenimiento"\n• "Combustible"';
    }

    return 'No entendí. Prueba: "EXC-01", "excavadoras", "mantenimiento", "ayuda"';
}

export default function Asistente() {
    const [abierto, setAbierto] = useState(false);
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [input, setInput] = useState('');
    const [cargando, setCargando] = useState(false);
    const [listo, setListo] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setListo(true);
        setMensajes([{ rol: 'assistant', texto: '¡Hola! ¿En qué puedo ayudarte?' }]);
    }, []);

    useEffect(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);

    if (!listo) return null;

    async function enviar() {
        if (!input.trim() || cargando) return;

        const texto = input.trim();
        setMensajes(prev => [...prev, { rol: 'user', texto }]);
        setInput('');
        setCargando(true);

        await new Promise(r => setTimeout(r, 400));

        const respuesta = generarRespuesta(texto);
        setMensajes(prev => [...prev, { rol: 'assistant', texto: respuesta }]);
        setCargando(false);
    }

    if (!abierto) {
        return (
            <button
                onClick={() => setAbierto(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-50"
            >
                <MessageCircle size={26} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
            <div className="bg-blue-600 text-white p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bot size={20} />
                    <span className="font-semibold">Asistente</span>
                </div>
                <button onClick={() => setAbierto(false)} className="hover:bg-white/20 p-1 rounded">
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                {mensajes.map((m, i) => (
                    <div key={i} className={`flex ${m.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                            m.rol === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white shadow rounded-bl-none'
                        }`}>
                            {m.texto}
                        </div>
                    </div>
                ))}
                {cargando && (
                    <div className="flex justify-start">
                        <div className="bg-white shadow px-3 py-2 rounded-lg">
                            <Loader2 size={16} className="animate-spin text-blue-600" />
                        </div>
                    </div>
                )}
                <div ref={ref} />
            </div>

            <div className="p-3 border-t bg-white">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Escribe tu pregunta..."
                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && enviar()}
                    />
                    <button
                        onClick={enviar}
                        disabled={cargando}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
