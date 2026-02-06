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
import { formatNumber } from '@/lib/utils';
import { createBrowserClient } from '@supabase/ssr';

// Registrar Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    operativo: 0,
    mantenimiento: 0,
    inoperativo: 0,
    alquilado: 0,
    horasPromedio: 0,
  });
  const [alertasUrgentes, setAlertasUrgentes] = useState<any[]>([]);
  const [topEquipos, setTopEquipos] = useState<any[]>([]);
  const [tiposCounts, setTiposCounts] = useState<Record<string, number>>({});
  const [resumenEquipos, setResumenEquipos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function fetchData() {
      try {
        const today = new Date();
        const dateIn15Days = new Date();
        dateIn15Days.setDate(today.getDate() + 15);
        const iso15Days = dateIn15Days.toISOString().split('T')[0];

        // 1. Estadísticas Generales (Counts)
        // Usamos head:true y count:exact para evitar descargar datos, solo contar
        const pTotal = supabase.from('maquinaria').select('*', { count: 'exact', head: true });
        const pOperativo = supabase.from('maquinaria').select('*', { count: 'exact', head: true }).eq('estado', 'OPERATIVO');
        const pMantenimiento = supabase.from('maquinaria').select('*', { count: 'exact', head: true }).eq('estado', 'EN MANTENIMIENTO');
        const pInoperativo = supabase.from('maquinaria').select('*', { count: 'exact', head: true }).eq('estado', 'INOPERATIVO');
        const pAlquilado = supabase.from('maquinaria').select('*', { count: 'exact', head: true }).eq('estado', 'ALQUILADO');

        // 2. Horas Promedio (Usamos RPC si existiera, o traemos solo la columna horas)
        // Para optimizar, traemos solo horas_actuales
        const pHoras = supabase.from('maquinaria').select('horas_actuales');

        // 3. Alertas Urgentes - Mantenimientos
        // Filtramos directamente en BD
        const pAlertasMtto = supabase
          .from('mantenimientos')
          .select('id, codigo_maquina, diferencia_horas, estado_alerta')
          .or('estado_alerta.eq.URGENTE,estado_alerta.eq.VENCIDO');

        // 4. SOAT por Vencer (próximos 15 días o vencidos)
        const pSoat = supabase
          .from('soat')
          .select('id, codigo, fecha_vencimiento')
          .lt('fecha_vencimiento', iso15Days)
          .order('fecha_vencimiento', { ascending: true });

        // 5. CITV por Vencer (próximos 15 días o vencidos)
        const pCitv = supabase
          .from('citv')
          .select('id, codigo, fecha_vencimiento')
          .lt('fecha_vencimiento', iso15Days)
          .order('fecha_vencimiento', { ascending: true });

        // 6. Datos para Gráficos
        // Top 10 Equipos por horas
        const pTop10 = supabase
          .from('maquinaria')
          .select('codigo, horas_actuales')
          .order('horas_actuales', { ascending: false })
          .limit(10);

        // Conteo por tipos
        const pTipos = supabase.from('maquinaria').select('tipo');

        // 7. Resumen Equipos (Tabla Pequeña - Top 10 recientes o por ID)
        const pResumen = supabase
          .from('maquinaria')
          .select('id, codigo, tipo, modelo, marca, horas_actuales, estado')
          .order('codigo', { ascending: true })
          .limit(10);

        // Ejecutar todo en paralelo
        const [
          resTotal, resOperativo, resMtto, resInop, resAlqu,
          resHoras, resAlertasMtto, resSoat, resCitv,
          resTop10, resTipos, resResumen
        ] = await Promise.all([
          pTotal, pOperativo, pMantenimiento, pInoperativo, pAlquilado,
          pHoras, pAlertasMtto, pSoat, pCitv,
          pTop10, pTipos, pResumen
        ]);

        if (cancelled) return;

        // Procesar Stats
        const horasData = resHoras.data || [];
        const totalHoras = horasData.reduce((acc: number, curr: any) => acc + (curr.horas_actuales || 0), 0);
        const promedio = horasData.length > 0 ? Math.round(totalHoras / horasData.length) : 0;

        setStats({
          total: resTotal.count || 0,
          operativo: resOperativo.count || 0,
          mantenimiento: resMtto.count || 0,
          inoperativo: resInop.count || 0,
          alquilado: resAlqu.count || 0,
          horasPromedio: promedio,
        });

        // Procesar Alertas
        const alertasCombinadas = [
          ...(resAlertasMtto.data || []).map((m: any) => ({
            tipo: 'mantenimiento',
            codigo: m.codigo_maquina,
            mensaje: m.estado_alerta === 'VENCIDO' ? '⛔ MANTENIMIENTO VENCIDO' : `🔴 Mantenimiento en ${m.diferencia_horas}h`,
            urgencia: m.estado_alerta === 'VENCIDO' ? 0 : 1
          })),
          ...(resSoat.data || []).map((s: any) => {
            const dias = calcularDiasRestantes(s.fecha_vencimiento);
            return {
              tipo: 'soat',
              codigo: s.codigo,
              mensaje: dias <= 0 ? '⛔ SOAT VENCIDO' : `🔴 SOAT vence en ${dias} días`,
              urgencia: dias <= 0 ? 0 : (dias <= 7 ? 1 : 2)
            };
          }),
          ...(resCitv.data || []).map((c: any) => {
            const dias = calcularDiasRestantes(c.fecha_vencimiento);
            return {
              tipo: 'citv',
              codigo: c.codigo,
              mensaje: dias <= 0 ? '⛔ CITV VENCIDO' : `🔴 CITV vence en ${dias} días`,
              urgencia: dias <= 0 ? 0 : (dias <= 7 ? 1 : 2)
            };
          })
        ].sort((a, b) => a.urgencia - b.urgencia);
        setAlertasUrgentes(alertasCombinadas);

        // Procesar Gráficos
        setTopEquipos(resTop10.data || []);

        const counts: Record<string, number> = {};
        (resTipos.data || []).forEach((item: any) => {
          counts[item.tipo] = (counts[item.tipo] || 0) + 1;
        });
        setTiposCounts(counts);

        setResumenEquipos(resResumen.data || []);

      } catch (error) {
        console.error('Error cargando dashboard:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    return () => { cancelled = true; };
  }, []);

  const calcularDiasRestantes = (fechaVencimiento: string | null): number => {
    if (!fechaVencimiento) return 999;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(fechaVencimiento);
    vencimiento.setHours(0, 0, 0, 0);
    const diffTime = vencimiento.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const disponibilidad = stats.total > 0
    ? ((stats.operativo + stats.alquilado) / stats.total * 100).toFixed(1)
    : '0';

  const doughnutData = {
    labels: Object.keys(tiposCounts),
    datasets: [{
      data: Object.values(tiposCounts),
      backgroundColor: [
        '#1E3A5F', '#2E7D32', '#F9A825', '#C62828', '#1565C0',
        '#7c3aed', '#0891b2', '#be185d', '#78716c',
      ],
      borderWidth: 0,
    }],
  };

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
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Cargando indicadores...</p>
        </div>
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
                {formatNumber(stats.horasPromedio)}
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
          <h2 className="text-lg font-bold text-gray-800">Resumen de Equipos (Top 10)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table table-card-view">
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
              {resumenEquipos.map((m) => (
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
