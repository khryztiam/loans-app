import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { RootLayout } from '@/components/layout/RootLayout';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Spinner, Button, Alert } from '@/components/ui';
import LoanRegisterModal from '@/components/LoanRegisterModal';
import loansService from '@/services/loans.service';
import * as inventoryService from '@/services/inventory.service';
import { useRouter } from 'next/router';
import { useNotification } from '@/hooks/useNotification';

export default function PrestamosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { addNotification } = useNotification();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [inventory, setInventory] = useState({ available: {}, total: {} });

  const loadLoans = useCallback(async () => {
    try {
      const data = await loansService.fetchActiveLoans();
      setLoans(data);

      // Cargar inventario disponible
      const inventoryData = await inventoryService.getInventoryStatus();
      setInventory(inventoryData);
    } catch (err) {
      addNotification('Error al cargar préstamos', 'error');
      console.error('Error completo:', err);
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      loadLoans();

      // ✅ Suscripción a cambios en tiempo real de tags_devices (inventario)
      const subscription = supabase
        .channel('realtime:tags_devices')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tags_devices' },
          () => {
            // Refrescar inventario cuando hay cambios
            loadLoans();
          }
        )
        .subscribe();

      // Limpiar suscripción al desmontar
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, authLoading, router, loadLoans]);

  const calculateStatus = (loan) => {
    const diasPasados = Math.floor(
      (Date.now() - new Date(loan.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const diasRestantes = loan.dias_prestamo - diasPasados;

    if (diasRestantes < 0) {
      return { status: 'vencido', text: `Vencido ${Math.abs(diasRestantes)}d`, color: 'bg-red-100 text-red-800' };
    } else if (diasRestantes <= 2) {
      return { status: 'proximo', text: `${diasRestantes}d restantes`, color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'activo', text: `${diasRestantes}d restantes`, color: 'bg-green-100 text-green-800' };
    }
  };

  const getEquipmentColor = (tipo) => {
    if (tipo.toLowerCase().includes('laptop')) {
      return {
        border: 'border-l-blue-600',
        bg: 'bg-blue-900',
        header: 'bg-blue-800',
        text: 'text-white',
        info: 'bg-blue-800',
      };
    } else if (tipo.toLowerCase().includes('desktop')) {
      return {
        border: 'border-l-purple-600',
        bg: 'bg-purple-900',
        header: 'bg-purple-800',
        text: 'text-white',
        info: 'bg-purple-800',
      };
    } else {
      return {
        border: 'border-l-gray-600',
        bg: 'bg-gray-800',
        header: 'bg-gray-700',
        text: 'text-white',
        info: 'bg-gray-700',
      };
    }
  };

  const groupedLoans = {
    laptop: loans.filter(l => l.tipo_equipo?.toLowerCase().includes('laptop')),
    desktop: loans.filter(l => l.tipo_equipo?.toLowerCase().includes('desktop')),
    otros: loans.filter(l => !l.tipo_equipo?.toLowerCase().includes('laptop') && !l.tipo_equipo?.toLowerCase().includes('desktop')),
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

  return (
    <ProtectedLayout>
      <RootLayout>
        {/* ALERTA FLOTANTE - Disponibilidad de equipos */}
        {(inventory.available < 2 || inventory.available === 0) && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-1/2">
            {inventory.available === 0 ? (
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg shadow-2xl p-4 border-l-4 border-red-900">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚨</span>
                  <div>
                    <h3 className="font-bold text-lg">¡ALERTA CRÍTICA!</h3>
                    <p className="text-sm">No hay equipos disponibles - {inventory.total} en total, todos en préstamo</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg shadow-2xl p-4 border-l-4 border-yellow-700">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="font-bold text-lg">Stock bajo</h3>
                    <p className="text-sm">{inventory.available} disponibles de {inventory.total} en inventario</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Gestión de Equipos</h2>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            + Registrar Movimiento
          </button>
        </div>

        {/* Modal para ENTREGA/RECEPCIÓN */}
        <LoanRegisterModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={loadLoans}
        />

        {/* Tarjetas de equipos activos */}
        <div className="space-y-8">
          {loans.length === 0 ? (
            <Alert variant="info">
              ✓ Todos los equipos han sido devueltos. ¡No hay préstamos activos!
            </Alert>
          ) : (
            <>
              {/* LAPTOPS */}
              {groupedLoans.laptop.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-600 rounded"></div>
                      <h3 className="text-xl font-bold text-gray-900">💻 Laptops en Préstamo ({groupedLoans.laptop.length})</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedLoans.laptop.map((loan) => {
                      const statusInfo = calculateStatus(loan);
                      const diasPasados = Math.floor(
                        (Date.now() - new Date(loan.created_at).getTime()) / (1000 * 60 * 60 * 24)
                      );
                      const colors = getEquipmentColor(loan.tipo_equipo);

                      return (
                        <div key={loan.id} className={`${colors.border} border-l-4 ${colors.bg} rounded-lg shadow-lg hover:shadow-xl transition-all overflow-hidden`}>
                          <div className={`${colors.header} px-4 py-3`}>
                            <h4 className={`font-bold text-lg ${colors.text}`}>{loan.nombre_recibe || 'Usuario'}</h4>
                            <p className={`text-sm ${colors.text} opacity-90 font-mono`}>SAPID: {loan.sapid_usuario ? String(loan.sapid_usuario).padStart(8, '0') : '—'}</p>
                          </div>

                          <div className={`px-4 py-3 space-y-2 text-sm ${colors.text}`}>
                            <div className="flex justify-between">
                              <span className="opacity-75">Equipo:</span>
                              <span className="font-semibold">{loan.tipo_equipo}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-75">Serie:</span>
                              <span className="font-semibold uppercase">{loan.serie}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-75">Entregado:</span>
                              <span className="font-semibold">{new Date(loan.created_at).toLocaleDateString('es-ES')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-75">Plazo:</span>
                              <span className="font-semibold">{loan.dias_prestamo}d ({diasPasados}d usado)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-75">Estado:</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.text}
                              </span>
                            </div>
                          </div>

                          {statusInfo.status === 'vencido' && (
                            <div className="bg-red-600 px-4 py-2 text-white text-xs font-semibold">
                              ⚠️ VENCIDO - Devolución urgente
                            </div>
                          )}

                          {statusInfo.status === 'proximo' && (
                            <div className="bg-yellow-600 px-4 py-2 text-white text-xs font-semibold">
                              ⏰ Próximo a vencer
                            </div>
                          )}

                          <div className="px-4 py-3">
                            <button
                              onClick={() => setModalOpen(true)}
                              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-all"
                            >
                              📥 Marcar como Devuelto
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DESKTOPS */}
              {groupedLoans.desktop.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-purple-600 rounded"></div>
                      <h3 className="text-xl font-bold text-gray-900">🖥️ Desktops en Préstamo ({groupedLoans.desktop.length})</h3>
                    </div>
                    <span className="text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-semibold">
                      {inventory.available} disponibles
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {groupedLoans.desktop.map((loan) => {
                      const statusInfo = calculateStatus(loan);
                      const diasPasados = Math.floor(
                        (Date.now() - new Date(loan.created_at).getTime()) / (1000 * 60 * 60 * 24)
                      );
                      const colors = getEquipmentColor(loan.tipo_equipo);

                      return (
                        <div key={loan.id} className={`${colors.border} border-l-4 ${colors.bg} rounded-lg shadow-lg hover:shadow-xl transition-all overflow-hidden`}>
                          <div className={`${colors.header} px-4 py-3`}>
                            <h4 className={`font-bold text-lg ${colors.text}`}>{loan.nombre_recibe || 'Usuario'}</h4>
                            <p className={`text-sm ${colors.text} opacity-90 font-mono`}>SAPID: {loan.sapid_usuario ? String(loan.sapid_usuario).padStart(8, '0') : '—'}</p>
                          </div>

                          <div className={`px-4 py-3 space-y-2 text-sm ${colors.text}`}>
                            <div className="flex justify-between">
                              <span className="opacity-75">Equipo:</span>
                              <span className="font-semibold">{loan.tipo_equipo}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-75">Serie:</span>
                              <span className="font-semibold uppercase">{loan.serie}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-75">Entregado:</span>
                              <span className="font-semibold">{new Date(loan.created_at).toLocaleDateString('es-ES')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-75">Plazo:</span>
                              <span className="font-semibold">{loan.dias_prestamo}d ({diasPasados}d usado)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-75">Estado:</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.text}
                              </span>
                            </div>
                          </div>

                          {statusInfo.status === 'vencido' && (
                            <div className="bg-red-600 px-4 py-2 text-white text-xs font-semibold">
                              ⚠️ VENCIDO - Devolución urgente
                            </div>
                          )}

                          {statusInfo.status === 'proximo' && (
                            <div className="bg-yellow-600 px-4 py-2 text-white text-xs font-semibold">
                              ⏰ Próximo a vencer
                            </div>
                          )}

                          <div className="px-4 py-3">
                            <button
                              onClick={() => setModalOpen(true)}
                              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-all"
                            >
                              📥 Marcar como Devuelto
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* OTROS */}
              {groupedLoans.otros.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-600 rounded"></div>
                      <h3 className="text-xl font-bold text-gray-900">📦 Otros Equipos ({groupedLoans.otros.length})</h3>
                    </div>
                    <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-semibold">
                      {inventory.available} disponibles
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    {groupedLoans.otros.map((loan) => {
                      const statusInfo = calculateStatus(loan);
                      const diasPasados = Math.floor(
                        (Date.now() - new Date(loan.created_at).getTime()) / (1000 * 60 * 60 * 24)
                      );
                      const colors = getEquipmentColor(loan.tipo_equipo);

                      return (
                        <div key={loan.id} className={`${colors.border} border-l-4 ${colors.bg} rounded-lg shadow-lg hover:shadow-xl transition-all overflow-hidden`}>
                          <div className={`${colors.header} px-4 py-3`}>
                            <h4 className={`font-bold text-lg ${colors.text}`}>{loan.nombre_recibe || 'Usuario'}</h4>
                            <p className={`text-sm ${colors.text} opacity-90 font-mono`}>SAPID: {loan.sapid_usuario ? String(loan.sapid_usuario).padStart(8, '0') : '—'}</p>
                          </div>

                          <div className={`px-4 py-3 space-y-2 text-sm ${colors.text}`}>
                            <div className="flex justify-between">
                              <span className="opacity-75">Equipo:</span>
                              <span className="font-semibold">{loan.tipo_equipo}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-75">Serie:</span>
                              <span className="font-semibold uppercase">{loan.serie}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-75">Entregado:</span>
                              <span className="font-semibold">{new Date(loan.created_at).toLocaleDateString('es-ES')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-75">Plazo:</span>
                              <span className="font-semibold">{loan.dias_prestamo}d ({diasPasados}d usado)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-75">Estado:</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.text}
                              </span>
                            </div>
                          </div>

                          {statusInfo.status === 'vencido' && (
                            <div className="bg-red-600 px-4 py-2 text-white text-xs font-semibold">
                              ⚠️ VENCIDO - Devolución urgente
                            </div>
                          )}

                          {statusInfo.status === 'proximo' && (
                            <div className="bg-yellow-600 px-4 py-2 text-white text-xs font-semibold">
                              ⏰ Próximo a vencer
                            </div>
                          )}

                          <div className="px-4 py-3">
                            <button
                              onClick={() => setModalOpen(true)}
                              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-all"
                            >
                              📥 Marcar como Devuelto
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </RootLayout>
    </ProtectedLayout>
  );
}
