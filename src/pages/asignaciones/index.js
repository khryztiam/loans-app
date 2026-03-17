import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RootLayout } from '@/components/layout/RootLayout';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Spinner, Alert, Button, Modal, Input, Select } from '@/components/ui';
import {
  fetchAllAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '@/services/assignments.service';
import { useRouter } from 'next/router';
import { useNotification } from '@/hooks/useNotification';
import { LAPTOP_MODELS, ACCESSORIES, LOCATIONS } from '@/lib/constants';

export default function AsignacionesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { success, error: showError } = useNotification();
  
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    sapid: '',
    modelo: '',
    serie: '',
    accesorios: [],
    localidad: '',
    fecha_asignacion: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState({});

  const loadAssignments = useCallback(async () => {
    try {
      const data = await fetchAllAssignments();
      setAssignments(data);
    } catch (err) {
      showError('Error al cargar asignaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      loadAssignments();
    }
  }, [user, authLoading, router, loadAssignments]);

  const resetForm = () => {
    setFormData({
      sapid: '',
      modelo: '',
      serie: '',
      accesorios: [],
      localidad: '',
      fecha_asignacion: new Date().toISOString().split('T')[0],
    });
    setErrors({});
    setEditingId(null);
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!formData.sapid || !formData.modelo || !formData.serie) {
      setErrors({ general: 'Complete todos los campos obligatorios' });
      return;
    }

    try {
      if (editingId) {
        await updateAssignment(editingId, formData);
        success('Asignación actualizada');
      } else {
        await createAssignment(formData);
        success('Asignación creada');
      }
      resetForm();
      setModalOpen(false);
      loadAssignments();
    } catch (err) {
      showError('Error al guardar asignación');
      console.error(err);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (confirm('¿Está seguro de que desea eliminar esta asignación?')) {
      try {
        await deleteAssignment(id);
        success('Asignación eliminada');
        loadAssignments();
      } catch (err) {
        showError('Error al eliminar asignación');
      }
    }
  };

  const handleEditAssignment = (assignment) => {
    setFormData(assignment);
    setEditingId(assignment.id);
    setModalOpen(true);
  };

  if (authLoading || loading) {
    return (
      <RootLayout>
        <div className="flex justify-center items-center h-96">
          <Spinner size="lg" />
        </div>
      </RootLayout>
    );
  }

  return (
    <ProtectedLayout>
      <RootLayout>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Asignaciones Permanentes</h2>
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
          >
            + Nueva Asignación
          </Button>
        </div>

        {/* Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            resetForm();
          }}
          title={editingId ? 'Editar Asignación' : 'Nueva Asignación'}
          size="lg"
        >
          <form onSubmit={handleSaveAssignment}>
            {errors.general && <Alert variant="error" className="mb-4">{errors.general}</Alert>}

            <Input
              label="SAP ID"
              placeholder="12345678"
              value={formData.sapid}
              onChange={(e) => setFormData((prev) => ({ ...prev, sapid: e.target.value }))}
              error={errors.sapid}
              required
            />

            <Select
              label="Modelo"
              options={LAPTOP_MODELS.map((m) => ({ value: m, label: m }))}
              value={formData.modelo}
              onChange={(e) => setFormData((prev) => ({ ...prev, modelo: e.target.value }))}
              error={errors.modelo}
              required
            />

            <Input
              label="Serie/Código"
              placeholder="ABC-123456"
              value={formData.serie}
              onChange={(e) => setFormData((prev) => ({ ...prev, serie: e.target.value }))}
              error={errors.serie}
              required
            />

            <Select
              label="Localidad"
              options={LOCATIONS.map((l) => ({ value: l, label: l }))}
              value={formData.localidad}
              onChange={(e) => setFormData((prev) => ({ ...prev, localidad: e.target.value }))}
            />

            <div className="mb-4">
              <label className="label">Accesorios</label>
              <div className="space-y-2">
                {ACCESSORIES.map((acc) => (
                  <label key={acc} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.accesorios?.includes(acc)}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          accesorios: e.target.checked
                            ? [...(prev.accesorios || []), acc]
                            : (prev.accesorios || []).filter((a) => a !== acc),
                        }));
                      }}
                      className="mr-2"
                    />
                    <span>{acc}</span>
                  </label>
                ))}
              </div>
            </div>

            <Input
              label="Fecha de Asignación"
              type="date"
              value={formData.fecha_asignacion}
              onChange={(e) => setFormData((prev) => ({ ...prev, fecha_asignacion: e.target.value }))}
            />

            <div className="flex gap-3">
              <Button variant="primary" type="submit" className="flex-1">
                {editingId ? 'Actualizar' : 'Crear'} Asignación
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Modal>

        {/* Tabla */}
        <div className="card">
          {assignments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay asignaciones registradas</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>SAPID</th>
                    <th>Modelo</th>
                    <th>Serie</th>
                    <th>Localidad</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment, idx) => (
                    <tr key={assignment.id}>
                      <td>{idx + 1}</td>
                      <td>{assignment.sapid}</td>
                      <td>{assignment.modelo}</td>
                      <td>{assignment.serie}</td>
                      <td>{assignment.localidad}</td>
                      <td>{assignment.fecha_asignacion}</td>
                      <td>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditAssignment(assignment)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </RootLayout>
    </ProtectedLayout>
  );
}
