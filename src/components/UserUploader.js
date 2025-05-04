import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import { supabase } from '../lib/supabase';
import { Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close'; // Ícono para cerrar el div

export default function UserUploader() {
  const [isOpen, setIsOpen] = useState(false);  // Estado para controlar la apertura del uploader

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet(1);

    const excelUsers = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // omitir encabezados
      const [sapid, nombre, descripcion, grupo, puesto, supervisor] = row.values.slice(1);
      if (sapid) {
        excelUsers.push({ sapid, nombre, descripcion, grupo, puesto, supervisor });
      }
    });

    const excelSapIds = excelUsers.map((u) => u.sapid);

    // 1. Obtener todos los usuarios actuales en Supabase
    const { data: currentUsers, error: fetchError } = await supabase.from('users').select('sapid');
    if (fetchError) {
      console.error('Error al obtener usuarios existentes:', fetchError);
      return;
    }

    const currentSapIds = currentUsers.map((u) => u.sapid);

    // 2. Determinar los que deben eliminarse (en Supabase pero no en Excel)
    const toDelete = currentSapIds.filter((sapid) => !excelSapIds.includes(sapid));

    // 3. Determinar los que deben insertarse (en Excel pero no en Supabase)
    const toInsert = excelUsers.filter((u) => !currentSapIds.includes(u.sapid));

    // 4. Ejecutar eliminaciones
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .in('sapid', toDelete);

      if (deleteError) {
        console.error('Error al eliminar usuarios dados de baja:', deleteError);
        return;
      }
    }

    // 5. Ejecutar inserciones
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('users')
        .insert(toInsert);

      if (insertError) {
        console.error('Error al insertar usuarios nuevos:', insertError);
        return;
      }
    }

    alert(`Carga completada. Insertados: ${toInsert.length}, Eliminados: ${toDelete.length}`);
  };

  return (
    <>
      {/* Botón flotante para abrir/cerrar el div */}
      <button
        className="floating-upload-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        +
      </button>

      {/* Div flotante para el uploader */}
      {isOpen && (
        <div className="floating-upload-container">
          <Typography variant="h5">Cargar usuarios desde Excel</Typography>

          {/* Botón para cerrar el div flotante */}
          <IconButton
            onClick={() => setIsOpen(false)} // Cerrar el div al hacer clic
            sx={{ position: 'absolute', top: '10px', right: '10px' }}
          >
            <CloseIcon />
          </IconButton>

          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileUpload}
            style={{ marginTop: '20px' }}
          />
        </div>
      )}
    </>
  );
}
