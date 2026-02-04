'use client';

import { useState, useEffect } from 'react';
import {
  Truck,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Building2,
  Clock,
  FileWarning,
  TrendingUp
} from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { ICONOS_MAQUINARIA, TipoMaquinaria } from '@/lib/types';
import { formatNumber, formatDate, calcularAlertaDocumento } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Datos de demo para cuando no hay Supabase configurado
const DEMO_DATA = {
  maquinaria: [
    { id: '1', codigo: 'EXC-01', tipo: 'EXCAVADORA', modelo: '320D', marca: 'CATERPILLAR', estado: 'OPERATIVO', horas_actuales: 15612 },
    { id: '2', codigo: 'MOT-01', tipo: 'MOTONIVELADORA', modelo: '135H', marca: 'CATERPILLAR', estado: 'OPERATIVO', horas_actuales: 12450 },
    { id: '3', codigo: 'CAR-01', tipo: 'CARGADOR FRONTAL', modelo: '950H', marca: 'CATERPILLAR', estado: 'EN MANTENIMIENTO', horas_actuales: 8900 },
    { id: '4', codigo: 'VOL-01', tipo: 'VOLQUETE', modelo: 'ACTROS', marca: 'MERCEDES BENZ', estado: 'OPERATIVO', horas_actuales: 45000 },
    { id: '5', codigo: 'CIST-01', tipo: 'CISTERNA DE AGUA', modelo: 'FM', marca: 'VOLVO', estado: 'OPERATIVO', horas_actuales: 23500 },
    { id: '6', codigo: 'ROD-01', tipo: 'RODILLO LISO', modelo: 'CS-533E', marca: 'CATERPILLAR', estado: 'INOPERATIVO', horas_actuales: 5600 },
    { id: '7', codigo: 'RET-01', tipo: 'RETROEXCAVADORA', modelo: '420F', marca: 'CATERPILLAR', estado: 'OPERATIVO', horas_actuales: 9800 },
    { id: '8', codigo: 'CAM-01', tipo: 'CAMIONETA', modelo: 'RANGER', marca: 'FORD', estado: 'ALQUILADO', horas_actuales: 120000 },
  ],
  mantenimientos: [
    { codigo_maquina: 'EXC-01', diferencia_horas: 30, estado_alerta: 'URGENTE' },
    { codigo_maquina: 'MOT-01', diferencia_horas: 75, estado_alerta: 'PROXIMO' },
    { codigo_maquina: 'CAR-01', diferencia_horas: 0, estado_alerta: 'VENCIDO' },
    { codigo_maquina: 'VOL-01', diferencia_horas: 180, estado_alerta: 'EN REGLA' },
  ],
  soat: [
    { codigo: 'VOL-01', fecha_vencimiento: '2026-02-10', dias_restantes: 13 },
    { codigo: 'CAM-01', fecha_vencimiento: '2026-02-05', dias_restantes: 8 },
    { codigo: 'CIST-01', fecha_vencimiento: '2026-04-15', dias_restantes: 77 },
  ],
  citv: [
    { codigo: 'VOL-01', fecha_vencimiento: '2026-02-20', dias_restantes: 23 },
    { codigo: 'CIST-01', fecha_vencimiento: '2026-05-15', dias_restantes: 107 },
  ],
};

export default function Dashboard() {
  const [maquinaria, setMaquinaria] = useState<any[]>(DEMO_DATA.maquinaria);
  const [mantenimientos, setMantenimientos] = useState<any[]>(DEMO_DATA.mantenimientos);
  const [soat, setSoat] = useState<any[]>(DEMO_DATA.soat);
  const [citv, setCitv] = useState<any[]>(DEMO_DATA.citv);
  const [loading, setLoading] = useState(false);
  const [usingDemo, setUsingDemo] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Si no hay configuración, mantener datos de demo
      if (!supabaseUrl || !apiKey) {
        console.warn('⚠️ Variables de Supabase no configuradas, usando datos de demo');
        setLoading(false);
        return;
      }

      const url = `${supabaseUrl}/rest/v1`;
      const headers: HeadersInit = { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` };

      try {
        // Cargar todos los datos en paralelo
        const [maqRes, mttoRes, soatRes, citvRes] = await Promise.all([
          fetch(`${url}/maquinaria?select=*&order=item`, { headers }),
          fetch(`${url}/mantenimientos?select=*`, { headers }),
          fetch(`${url}/soat?select=*`, { headers }),
          fetch(`${url}/citv?select=*`, { headers })
        ]);

        if (cancelled) return;

        if (maqRes.ok) {
          const data = await maqRes.json();
          if (data?.length > 0) {
            setMaquinaria(data);
            setUsingDemo(false);
            console.log('✅ Datos cargados:', data.length, 'equipos');
          }
        }

        if (mttoRes.ok) setMantenimientos(await mttoRes.json());
        if (soatRes.ok) setSoat(await soatRes.json());
        if (citvRes.ok) setCitv(await citvRes.json());

      } catch (err) {
        console.error('Error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  // Calcular estadísticas
  const stats = {
    total: maquinaria.length,
    operativo: maquinaria.filter(m => m.estado === 'OPERATIVO').length,
    mantenimiento: maquinaria.filter(m => m.estado === 'EN MANTENIMIENTO').length,
    inoperativo: maquinaria.filter(m => m.estado === 'INOPERATIVO').length,
    alquilado: maquinaria.filter(m => m.estado === 'ALQUILADO').length,
  };

  const disponibilidad = ((stats.operativo + stats.alquilado) / stats.total * 100).toFixed(1);

  // Alertas urgentes
  const alertasUrgentes = [
    ...mantenimientos
      .filter(m => m.estado_alerta === 'URGENTE' || m.estado_alerta === 'VENCIDO')
      .map(m => ({
        tipo: 'mantenimiento',
        codigo: m.codigo_maquina,
        mensaje: m.estado_alerta === 'VENCIDO'
          ? `⛔ MANTENIMIENTO VENCIDO`
          : `🔴 Mantenimiento en ${m.diferencia_horas}h`,
        urgencia: m.estado_alerta === 'VENCIDO' ? 0 : 1,
      })),
    ...soat
      .filter(s => s.dias_restantes <= 15)
      .map(s => ({
        tipo: 'soat',
        codigo: s.codigo,
        mensaje: s.dias_restantes <= 0
          ? `⛔ SOAT VENCIDO`
          : `🔴 SOAT vence en ${s.dias_restantes} días`,
        urgencia: s.dias_restantes <= 0 ? 0 : (s.dias_restantes <= 7 ? 1 : 2),
      })),
    ...citv
      .filter(c => c.dias_restantes <= 15)
      .map(c => ({
        tipo: 'citv',
        codigo: c.codigo,
        mensaje: c.dias_restantes <= 0
          ? `⛔ CITV VENCIDO`
          : `🔴 CITV vence en ${c.dias_restantes} días`,
        urgencia: c.dias_restantes <= 0 ? 0 : (c.dias_restantes <= 7 ? 1 : 2),
      })),
  ].sort((a, b) => a.urgencia - b.urgencia);

  // Datos para gráfico de dona
  const tiposCounts = maquinaria.reduce((acc, m) => {
    acc[m.tipo] = (acc[m.tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const doughnutData = {
    labels: Object.keys(tiposCounts),
    datasets: [{
      data: Object.values(tiposCounts),
      backgroundColor: [
        '#1E3A5F',
        '#2E7D32',
        '#F9A825',
        '#C62828',
        '#1565C0',
        '#7c3aed',
        '#0891b2',
        '#be185d',
        '#78716c',
      ],
      borderWidth: 0,
    }],
  };

  // Datos para gráfico de barras (Top 10 equipos por horas)
  const topEquipos = [...maquinaria]
    .sort((a, b) => b.horas_actuales - a.horas_actuales)
    .slice(0, 10);

  const barData = {
    labels: topEquipos.map(e => e.codigo),
    datasets: [{
      label: 'Horas',
      data: topEquipos.map(e => e.horas_actuales),
      backgroundColor: 'rgba(30, 58, 95, 0.8)',
      borderRadius: 8,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Control de maquinaria pesada - Grupo Vásquez</p>
        </div>
        <div className="flex items-center gap-3">
          {usingDemo && (
            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
              ⚠️ Datos de demostración
            </span>
          )}
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString('es-PE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stat-card card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Truck className="text-white" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Equipos</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="stat-card operativo card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <CheckCircle2 className="text-white" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Operativos</p>
              <p className="text-2xl font-bold text-green-600">{stats.operativo}</p>
            </div>
          </div>
        </div>

        <div className="stat-card mantenimiento card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <Wrench className="text-white" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">En Mantenimiento</p>
              <p className="text-2xl font-bold text-amber-600">{stats.mantenimiento}</p>
            </div>
          </div>
        </div>

        <div className="stat-card inoperativo card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <AlertTriangle className="text-white" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Inoperativos</p>
              <p className="text-2xl font-bold text-red-600">{stats.inoperativo}</p>
            </div>
          </div>
        </div>

        <div className="stat-card alquilado card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
              <Building2 className="text-white" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Alquilados</p>
              <p className="text-2xl font-bold text-blue-600">{stats.alquilado}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Disponibilidad de Flota</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{disponibilidad}%</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
              <TrendingUp className="text-green-600" size={28} />
            </div>
          </div>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
              style={{ width: `${disponibilidad}%` }}
            />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Alertas Activas</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{alertasUrgentes.length}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
              <FileWarning className="text-red-600" size={28} />
            </div>
          </div>
          <p className="text-gray-400 text-sm mt-2">Requieren atención inmediata</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Horas Promedio</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {formatNumber(Math.round(maquinaria.reduce((a, m) => a + m.horas_actuales, 0) / maquinaria.length))}
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <Clock className="text-blue-600" size={28} />
            </div>
          </div>
          <p className="text-gray-400 text-sm mt-2">Horómetro promedio de flota</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertas Urgentes */}
        <div className="lg:col-span-1">
          <div className="card p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} />
              Alertas Críticas
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {alertasUrgentes.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle2 size={48} className="mx-auto mb-2 text-green-400" />
                  <p>No hay alertas pendientes</p>
                </div>
              ) : (
                alertasUrgentes.map((alerta, index) => (
                  <div
                    key={index}
                    className={`alert-card ${alerta.urgencia === 0 ? 'urgente' : alerta.urgencia === 1 ? 'urgente' : 'proximo'}`}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{alerta.codigo}</p>
                      <p className="text-sm text-gray-600">{alerta.mensaje}</p>
                    </div>
                    <span className="text-xs uppercase text-gray-500">{alerta.tipo}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gráfico de Dona */}
          <div className="card p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Distribución por Tipo</h2>
            <div className="chart-container" style={{ height: '250px' }}>
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11 }
                      }
                    }
                  },
                  cutout: '60%',
                }}
              />
            </div>
          </div>

          {/* Gráfico de Barras */}
          <div className="card p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Top 10 - Horas de Operación</h2>
            <div className="chart-container" style={{ height: '250px' }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Resumen de Equipos */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Resumen de Equipos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Modelo</th>
                <th>Marca</th>
                <th>Horas</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {maquinaria.slice(0, 10).map((m) => (
                <tr key={m.id}>
                  <td className="font-semibold">{m.codigo}</td>
                  <td>
                    <span className="flex items-center gap-2">
                      <span>{ICONOS_MAQUINARIA[m.tipo as TipoMaquinaria] || '🔧'}</span>
                      {m.tipo}
                    </span>
                  </td>
                  <td>{m.modelo}</td>
                  <td>{m.marca}</td>
                  <td>{formatNumber(m.horas_actuales)}</td>
                  <td>
                    <span className={`badge badge-${m.estado.toLowerCase().replace('en ', '')}`}>
                      {m.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
