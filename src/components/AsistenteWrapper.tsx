'use client';

import dynamic from 'next/dynamic';

const Asistente = dynamic(() => import('./Asistente'), { ssr: false });

export default function AsistenteWrapper() {
    return <Asistente />;
}
