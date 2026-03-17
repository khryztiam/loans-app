import { useState, useCallback, useRef } from 'react';
import { EQUIPMENT_TYPES } from '@/lib/constants';
import loansService from '@/services/loans.service';
import usersService from '@/services/users.service';
import * as inventoryService from '@/services/inventory.service';
import { useNotification } from '@/hooks/useNotification';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';

const LoanRegisterModal = ({ isOpen, onClose, onSuccess }) => {
  // Estado principal
  const [mode, setMode] = useState('ENTREGA'); // ENTREGA | RECEPCION
  const [step, setStep] = useState(1); // 1 = búsqueda | 2 = datos | 3 = confirmación (ENTREGA), 1 = búsqueda | 2 = confirmación (RECEPCION)
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceTimer = useRef(null);

  // Datos ENTREGA
  const [sapid, setSapid] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [equipment, setEquipment] = useState('');
  const [serie, setSerie] = useState('');
  const [daysLoan, setDaysLoan] = useState('7');
  const [nombreRecibe, setNombreRecibe] = useState('');

  // Datos RECEPCION
  const [loanSearchResults, setLoanSearchResults] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loanSearchQuery, setLoanSearchQuery] = useState('');
  const [sapidEntrega, setSapidEntrega] = useState('');
  const [userEntregaResults, setUserEntregaResults] = useState([]);
  const [selectedUserEntrega, setSelectedUserEntrega] = useState(null);

  const { addNotification } = useNotification();

  // ========== ENTREGA: Búsqueda de usuario con debounce ==========
  const handleSearchUser = useCallback((value) => {
    setSapid(value);
    clearTimeout(debounceTimer.current);

    if (value.length < 2) {
      setUserSearchResults([]);
      setSelectedUser(null);
      return;
    }

    setSearching(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await usersService.searchUsers(value);
        setUserSearchResults(results || []);
      } catch (error) {
        console.error('Error searching users:', error);
        addNotification('Error buscando usuarios', 'error');
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [addNotification]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSapid(user.sapid);
    setNombreRecibe(user.nombre);
    setUserSearchResults([]);
  };

  // ========== RECEPCION: Búsqueda de préstamos activos ==========
  const handleSearchLoans = useCallback(async (value) => {
    setLoanSearchQuery(value);

    if (value.length < 2) {
      setLoanSearchResults([]);
      setSelectedLoan(null);
      return;
    }

    setSearching(true);
    try {
      // Buscar préstamos activos (sin received_at)
      const loans = await loansService.searchActiveLoans(value);
      setLoanSearchResults(loans || []);
    } catch (error) {
      console.error('Error searching loans:', error);
      addNotification('Error buscando préstamos', 'error');
    } finally {
      setSearching(false);
    }
  }, [addNotification]);

  const handleSelectLoan = (loan) => {
    setSelectedLoan(loan);
    setLoanSearchQuery('');
    setLoanSearchResults([]);
  };

  // ========== RECEPCION: Búsqueda de usuario que entrega ==========
  const handleSearchUserEntrega = useCallback((value) => {
    setSapidEntrega(value);
    clearTimeout(debounceTimer.current);

    if (value.length < 2) {
      setUserEntregaResults([]);
      setSelectedUserEntrega(null);
      return;
    }

    setSearching(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await usersService.searchUsers(value);
        setUserEntregaResults(results || []);
      } catch (error) {
        console.error('Error searching users:', error);
        addNotification('Error buscando usuarios', 'error');
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [addNotification]);

  const handleSelectUserEntrega = (user) => {
    setSelectedUserEntrega(user);
    setSapidEntrega(user.sapid);
    setUserEntregaResults([]);
  };

  // ========== ENTREGA: Validación y creación de préstamo ==========
  const validateEntregaForm = () => {
    if (!selectedUser || !selectedUser.sapid) {
      addNotification('Debes seleccionar un usuario válido', 'error');
      return false;
    }
    if (!equipment) {
      addNotification('El tipo de equipo es requerido', 'error');
      return false;
    }
    if (!serie || serie.trim().length === 0) {
      addNotification('La serie/modelo es requerida', 'error');
      return false;
    }
    if (!daysLoan || parseInt(daysLoan) <= 0) {
      addNotification('Los días de préstamo deben ser mayor a 0', 'error');
      return false;
    }
    return true;
  };

  const handleCreateLoan = async () => {
    if (!validateEntregaForm()) return;

    setLoading(true);
    try {
      const loanData = {
        sapid_usuario: selectedUser.sapid,
        nombre_recibe: selectedUser.nombre,
        tipo_equipo: equipment,
        serie: serie.toUpperCase(),
        dias_prestamo: parseInt(daysLoan),
        created_at: new Date().toISOString(),
      };

      await loansService.createLoan(loanData);
      
      // ✅ Actualizar inventario: marcar equipo como entregado (in_loan = true)
      await inventoryService.findAndUpdateDeviceByServiceTag(serie.toUpperCase(), true);
      
      addNotification('✅ Préstamo registrado exitosamente', 'success');
      resetForm();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating loan:', error);
      addNotification('Error al registrar el préstamo', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ========== RECEPCION: Marcar como recibido ==========
  const handleReceiveLoan = async () => {
    if (!selectedLoan) {
      addNotification('Debes seleccionar un préstamo', 'error');
      return;
    }
    if (!selectedUserEntrega || !selectedUserEntrega.sapid) {
      addNotification('Debes seleccionar quién entrega el equipo', 'error');
      return;
    }

    setLoading(true);
    try {
      await loansService.receiveLoan(selectedLoan.id, selectedUserEntrega.sapid);
      
      // ✅ Actualizar inventario: marcar equipo como disponible (in_loan = false)
      await inventoryService.findAndUpdateDeviceByServiceTag(selectedLoan.serie, false);
      
      addNotification(`✅ Equipo recibido de ${selectedUserEntrega.nombre}: ${selectedLoan.tipo_equipo}`, 'success');
      resetForm();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error receiving loan:', error);
      addNotification('Error al marcar equipo como recibido', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ========== Utils ==========
  const resetForm = () => {
    setMode('ENTREGA');
    setStep(1);
    setSapid('');
    setSelectedUser(null);
    setEquipment('');
    setSerie('');
    setDaysLoan('7');
    setNombreRecibe('');
    setLoanSearchQuery('');
    setSelectedLoan(null);
    setUserSearchResults([]);
    setLoanSearchResults([]);
    setSapidEntrega('');
    setSelectedUserEntrega(null);
    setUserEntregaResults([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ========== RENDER ENTREGA ==========
  const renderEntrega = () => {
    if (step === 1) {
      return (
        <div className="space-y-4">
          <div>
            <label className="label">Buscar usuario (SAPID o nombre)</label>
            <Input
              type="text"
              placeholder="Ej: 12345678 o Juan"
              value={sapid}
              onChange={(e) => handleSearchUser(e.target.value)}
              disabled={loading}
            />
            {searching && <Spinner />}

            {/* Resultados búsqueda */}
            {userSearchResults.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded">
                {userSearchResults.map((user) => (
                  <div
                    key={user.sapid}
                    onClick={() => handleSelectUser(user)}
                    className="cursor-pointer p-3 border-b hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-semibold text-sm">{user.nombre}</div>
                    <div className="text-xs text-gray-600">
                      {user.sapid} • {user.puesto || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Usuario seleccionado */}
            {selectedUser && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="font-semibold text-sm">{selectedUser.nombre}</div>
                <div className="text-xs text-gray-700 mt-1">
                  <span className="font-medium">SAPID:</span> {selectedUser.sapid}
                  <br />
                  <span className="font-medium">Puesto:</span> {selectedUser.puesto || 'N/A'}
                  <br />
                  <span className="font-medium">Grupo:</span> {selectedUser.grupo || 'N/A'}
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setSapid('');
                  }}
                  className="text-xs text-red-600 mt-2 hover:underline"
                >
                  Cambiar usuario
                </button>
              </div>
            )}
          </div>

          <Button
            onClick={() => setStep(2)}
            disabled={!selectedUser || loading}
            className="w-full btn-primary"
          >
            Siguiente
          </Button>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4">
          <div>
            <label className="label">Tipo de equipo</label>
            <Select 
              value={equipment} 
              onChange={(e) => setEquipment(e.target.value)} 
              disabled={loading}
              options={EQUIPMENT_TYPES}
            />
          </div>

          <div>
            <label className="label">Serie/Modelo</label>
            <Input
              type="text"
              placeholder="Ej: ABC123, 12345ABC"
              value={serie}
              onChange={(e) => setSerie(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="label">Días de préstamo</label>
            <Input
              type="number"
              min="1"
              max="365"
              value={daysLoan}
              onChange={(e) => setDaysLoan(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-gray-600 mt-1">
              Será devuelto aproximadamente el{' '}
              {new Date(Date.now() + parseInt(daysLoan) * 24 * 60 * 60 * 1000)
                .toLocaleDateString('es-ES')}
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={() => setStep(1)} variant="secondary" className="flex-1">
              Atrás
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!equipment || !serie || loading}
              className="flex-1 btn-primary"
            >
              Revisar
            </Button>
          </div>
        </div>
      );
    }

    if (step === 3) {
      const devuelveEnDias = Math.floor(
        (new Date(Date.now() + parseInt(daysLoan) * 24 * 60 * 60 * 1000).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );

      return (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <h3 className="font-semibold text-sm mb-3">Confirma los datos:</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Usuario:</span>
                <span className="font-medium">{selectedUser.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">SAPID:</span>
                <span className="font-medium">{selectedUser.sapid}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Equipo:</span>
                  <span className="font-medium">{equipment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Serie:</span>
                  <span className="font-medium uppercase">{serie}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Plazo:</span>
                  <span className="font-medium">{daysLoan} días</span>
                </div>
              </div>
              <div className="border-t pt-2 mt-2 bg-orange-50 rounded p-2">
                <div className="text-orange-800 text-xs">
                  ⚠️ Debe devolverse aproximadamente en {devuelveEnDias} días
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setStep(2)} variant="secondary" className="flex-1">
              Editar
            </Button>
            <Button
              onClick={handleCreateLoan}
              disabled={loading}
              className="flex-1 btn-success"
            >
              {loading ? 'Registrando...' : '✓ Confirmar'}
            </Button>
          </div>
        </div>
      );
    }
  };

  // ========== RENDER RECEPCION ==========
  const renderRecepcion = () => {
    if (step === 1) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Busca el equipo que quieres marcar como recibido
          </p>

          <div>
            <label className="label">Buscar préstamo activo</label>
            <Input
              type="text"
              placeholder="Ej: usuario, serie de equipo..."
              value={loanSearchQuery}
              onChange={(e) => handleSearchLoans(e.target.value)}
              disabled={loading}
            />
            {searching && <Spinner />}

            {/* Resultados búsqueda */}
            {loanSearchResults.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded">
                {loanSearchResults.map((loan) => (
                  <div
                    key={loan.id}
                    onClick={() => handleSelectLoan(loan)}
                    className="cursor-pointer p-3 border-b hover:bg-green-50 transition-colors"
                  >
                    <div className="font-semibold text-sm">{loan.nombre_recibe}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {loan.tipo_equipo} • {loan.serie}
                      <br />
                      Entregado hace{' '}
                      {Math.floor((Date.now() - new Date(loan.created_at).getTime()) / (1000 * 60 * 60 * 24))}{' '}
                      días
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Préstamo seleccionado */}
            {selectedLoan && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                <div className="font-semibold text-sm">{selectedLoan.nombre_recibe}</div>
                <div className="text-xs text-gray-700 mt-1">
                  <span className="font-medium">Equipo:</span> {selectedLoan.tipo_equipo}
                  <br />
                  <span className="font-medium">Serie:</span> {selectedLoan.serie}
                  <br />
                  <span className="font-medium">Plazo:</span> {selectedLoan.dias_prestamo} días
                </div>
                <button
                  onClick={() => {
                    setSelectedLoan(null);
                    setLoanSearchQuery('');
                  }}
                  className="text-xs text-red-600 mt-2 hover:underline"
                >
                  Cambiar préstamo
                </button>
              </div>
            )}
          </div>

          <Button
            onClick={() => setStep(2)}
            disabled={!selectedLoan || loading}
            className="w-full btn-primary"
          >
            Siguiente
          </Button>
        </div>
      );
    }

    if (step === 2) {
      const diasPasados = Math.floor(
        (Date.now() - new Date(selectedLoan.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      const diasRestantes = selectedLoan.dias_prestamo - diasPasados;
      const isOverdue = diasRestantes < 0;

      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            ¿Quién entrega el equipo? (Busca por nombre o SAPID)
          </p>

          <div>
            <label className="label">Buscar usuario que entrega</label>
            <Input
              type="text"
              placeholder="Ej: juan, 12345..."
              value={sapidEntrega}
              onChange={(e) => handleSearchUserEntrega(e.target.value)}
              disabled={loading}
            />
            {searching && <Spinner />}

            {/* Resultados búsqueda */}
            {userEntregaResults.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded">
                {userEntregaResults.map((user) => (
                  <div
                    key={user.sapid}
                    onClick={() => handleSelectUserEntrega(user)}
                    className="cursor-pointer p-3 border-b hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-semibold text-sm">{user.nombre}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      SAPID: {user.sapid} • {user.puesto || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Usuario seleccionado */}
            {selectedUserEntrega && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="font-semibold text-sm">{selectedUserEntrega.nombre}</div>
                <div className="text-xs text-gray-700 mt-1">
                  <span className="font-medium">SAPID:</span> {selectedUserEntrega.sapid}
                  <br />
                  <span className="font-medium">Puesto:</span> {selectedUserEntrega.puesto || 'N/A'}
                </div>
                <button
                  onClick={() => {
                    setSelectedUserEntrega(null);
                    setSapidEntrega('');
                  }}
                  className="text-xs text-red-600 mt-2 hover:underline"
                >
                  Cambiar usuario
                </button>
              </div>
            )}
          </div>

          <Button
            onClick={() => setStep(3)}
            disabled={!selectedUserEntrega || loading}
            className="w-full btn-primary"
          >
            Siguiente
          </Button>
          <Button
            onClick={() => setStep(1)}
            variant="secondary"
            className="w-full"
          >
            Atrás
          </Button>
        </div>
      );
    }

    if (step === 3) {
      const diasPasados = Math.floor(
        (Date.now() - new Date(selectedLoan.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      const diasRestantes = selectedLoan.dias_prestamo - diasPasados;
      const isOverdue = diasRestantes < 0;

      return (
        <div className="space-y-4">
          <div className={`rounded p-3 ${isOverdue ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
            <h3 className="font-semibold text-sm mb-2">Confirma recepción del equipo</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Usuario recibe:</span>
                <span className="font-medium">{selectedLoan.nombre_recibe}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Usuario entrega:</span>
                <span className="font-medium">{selectedUserEntrega.nombre}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Equipo:</span>
                  <span className="font-medium">{selectedLoan.tipo_equipo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Serie:</span>
                  <span className="font-medium uppercase">{selectedLoan.serie}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Entregado hace:</span>
                    <span className="font-medium">{diasPasados} días</span>
                  </div>
                  <div className={`flex justify-between font-medium ${isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                    <span>Plazo:</span>
                    <span>{selectedLoan.dias_prestamo} días {isOverdue ? `(VENCIDO ${Math.abs(diasRestantes)} días)` : `(${diasRestantes} días restantes)`}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setStep(2)} variant="secondary" className="flex-1">
              Atrás
            </Button>
            <Button
              onClick={handleReceiveLoan}
              disabled={loading}
              className="flex-1 btn-success"
            >
              {loading ? 'Procesando...' : '✓ Marcar como recibido'}
            </Button>
          </div>
        </div>
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="">
      <div className="space-y-4">
        {/* Header con modo */}
        <div className="border-b pb-4">
          <h2 className="font-bold text-lg mb-3">Gestión de Equipos</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setMode('ENTREGA');
                setStep(1);
                setSelectedLoan(null);
              }}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-all ${
                mode === 'ENTREGA'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📤 ENTREGA
            </button>
            <button
              onClick={() => {
                setMode('RECEPCION');
                setStep(1);
                setSelectedUser(null);
              }}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-all ${
                mode === 'RECEPCION'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📥 RECEPCIÓN
            </button>
          </div>
        </div>

        {/* Contenido dinámico */}
        {mode === 'ENTREGA' ? renderEntrega() : renderRecepcion()}
      </div>
    </Modal>
  );
};

export default LoanRegisterModal;