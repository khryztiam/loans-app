import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RootLayout } from '@/components/layout/RootLayout';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Button, Modal, Input, Alert } from '@/components/ui';
import usersService from '@/services/users.service';
import { useNotification } from '@/hooks/useNotification';
import ExcelJS from 'exceljs';

export default function UsuariosPage() {
  const { user } = useAuth();
  const { success, error: showError } = useNotification();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const handleFileUpload = async (event) => {
    setLoading(true);
    const file = event.target.files[0];
    if (!file) {
      setLoading(false);
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.getWorksheet(1);

      const users = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        const [sapid, nombre, descripcion, grupo, puesto, supervisor] = row.values?.slice(1) || [];
        if (sapid) {
          users.push({
            sapid: String(sapid).trim(),
            nombre: nombre || '',
            descripcion: descripcion || '',
            grupo: grupo || '',
            puesto: puesto || '',
            supervisor: supervisor || '',
          });
        }
      });

      const uniqueUsers = Array.from(new Map(users.map((u) => [u.sapid, u])).values());

      const count = await usersService.upsertUsers(uniqueUsers);

      setSummary({
        total: users.length,
        unique: uniqueUsers.length,
        imported: count || uniqueUsers.length,
      });

      success(`Se importaron ${count || uniqueUsers.length} usuarios`);
    } catch (err) {
      showError('Error al procesar el archivo Excel');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedLayout>
      <RootLayout>
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Usuarios</h2>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Importar Usuarios desde Excel</h3>
          <p className="text-gray-600 mb-4">
            Cargue un archivo Excel con las siguientes columnas: SAPID, Nombre, Descripción, Grupo, Puesto, Supervisor
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={loading}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <Button variant="primary" as="span" disabled={loading}>
                {loading ? 'Procesando...' : '📁 Seleccionar Archivo Excel'}
              </Button>
            </label>
          </div>

          {summary && (
            <Alert variant="info" className="mt-4">
              <p>
                <strong>Resumen de importación:</strong>
              </p>
              <p>Total de registros: {summary.total}</p>
              <p>Únicos: {summary.unique}</p>
              <p>Importados: {summary.imported}</p>
            </Alert>
          )}
        </div>
      </RootLayout>
    </ProtectedLayout>
  );
}
