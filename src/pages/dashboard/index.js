import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RootLayout } from '@/components/layout/RootLayout';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Spinner, Alert, Button } from '@/components/ui';
import loansService from '@/services/loans.service';
import { useRouter } from 'next/router';

const MetricCard = ({ title, value, description, type = 'info' }) => {
  const styles = {
    info: {
      border: 'border-l-4 border-l-blue-600',
      bg: 'bg-gradient-to-br from-blue-600 to-blue-700',
      titleColor: 'text-blue-100',
      valueColor: 'text-white',
      descColor: 'text-blue-100',
    },
    warning: {
      border: 'border-l-4 border-l-red-600',
      bg: 'bg-gradient-to-br from-red-600 to-red-700',
      titleColor: 'text-red-100',
      valueColor: 'text-white',
      descColor: 'text-red-100',
    },
    success: {
      border: 'border-l-4 border-l-green-600',
      bg: 'bg-gradient-to-br from-green-600 to-green-700',
      titleColor: 'text-green-100',
      valueColor: 'text-white',
      descColor: 'text-green-100',
    },
  };

  const style = styles[type];

  return (
    <div className={`${style.border} ${style.bg} rounded-lg p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}>
      <div className={`text-sm font-semibold ${style.titleColor} mb-2 uppercase tracking-wider`}>{title}</div>
      <div className={`text-4xl font-bold ${style.valueColor} mb-2`}>
        {value}
      </div>
      <div className={`text-sm ${style.descColor}`}>{description}</div>
    </div>
  );
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    const loadData = async () => {
      try {
        // Cargar métricas
        const metricsData = await loansService.fetchLoanMetrics();
        setMetrics(metricsData);

        // Cargar préstamos activos para tracking
        const loansData = await loansService.fetchActiveLoans();
        setLoans(loansData);
      } catch (err) {
        setError('Error al cargar datos. Intente posteriormente.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const calculateStatus = (loan) => {
    const diasPasados = Math.floor(
      (Date.now() - new Date(loan.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const diasRestantes = loan.dias_prestamo - diasPasados;

    if (diasRestantes < 0) {
      return { status: 'vencido', label: 'VENCIDO', color: 'red' };
    } else if (diasRestantes <= 2) {
      return { status: 'proximo', label: 'POR VENCER', color: 'yellow' };
    } else {
      return { status: 'activo', label: 'ACTIVO', color: 'green' };
    }
  };

  if (authLoading || loading) {
    return (
      <RootLayout>
        <div className="flex justify-center items-center h-96">
          <Spinner />
        </div>
      </RootLayout>
    );
  }

  if (error) {
    return (
      <RootLayout>
        <Alert variant="error">{error}</Alert>
      </RootLayout>
    );
  }

  return (
    <ProtectedLayout>
      <RootLayout>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Resumen de préstamos y asignaciones de equipos IT</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <MetricCard
            title="Préstamos Activos"
            value={metrics?.activeLoans || 0}
            description="Equipos en poder del personal"
            type="info"
          />
          <MetricCard
            title="Préstamos Vencidos"
            value={metrics?.overdueLoans || 0}
            description="Equipos que excedieron plazo"
            type="warning"
          />
          <MetricCard
            title="Esta Semana"
            value={metrics?.weeklyLoans || 0}
            description="Nuevos préstamos registrados"
            type="success"
          />
        </div>

        {/* Acciones rápidas */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">⚡ Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/prestamos')}
              className="p-6 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all text-left transform hover:scale-105"
            >
              <div className="font-bold text-xl">📤 Registrar Movimiento</div>
              <div className="text-sm text-blue-100 mt-2">Entrega o recepción de equipo</div>
            </button>

            <button
              onClick={() => router.push('/asignaciones')}
              className="p-6 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md hover:shadow-lg transition-all text-left transform hover:scale-105"
            >
              <div className="font-bold text-xl">🏷️ Nueva Asignación</div>
              <div className="text-sm text-purple-100 mt-2">Asignar equipo permanente</div>
            </button>

            <button
              onClick={() => router.push('/usuarios')}
              className="p-6 rounded-lg bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg transition-all text-left transform hover:scale-105"
            >
              <div className="font-bold text-xl">👥 Importar Usuarios</div>
              <div className="text-sm text-green-100 mt-2">Cargar base de datos de personal</div>
            </button>

            <button
              onClick={() => router.push('/prestamos')}
              className="p-6 rounded-lg bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-md hover:shadow-lg transition-all text-left transform hover:scale-105"
            >
              <div className="font-bold text-xl">📊 Ver Todos los Equipos</div>
              <div className="text-sm text-orange-100 mt-2">Listado completo de préstamos</div>
            </button>
          </div>
        </div>
      </RootLayout>
    </ProtectedLayout>
  );
}