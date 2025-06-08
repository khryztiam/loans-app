import React, { useState } from "react";
import ExcelJS from "exceljs";
import { supabase } from "../lib/supabase";

export default function UserUploader() {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (event) => {
    setIsLoading(true);

    const file = event.target.files[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet(1);

    const excelUsers = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      let [sapid, nombre, descripcion, grupo, puesto, supervisor] =
        row.values.slice(1);
      if (sapid) {
        sapid = String(sapid).trim();
        excelUsers.push({
          sapid,
          nombre,
          descripcion,
          grupo,
          puesto,
          supervisor,
        });
      }
    });

    // Eliminar duplicados en Excel
    const uniqueExcelUsers = Array.from(
      new Map(excelUsers.map((u) => [u.sapid, u])).values()
    );

    // Hacer UPSERT (insertar nuevos y actualizar existentes)
    const { error: upsertError, count } = await supabase
      .from("users")
      .upsert(uniqueExcelUsers, { onConflict: ["sapid"], count: "exact" });

    if (upsertError) {
      console.error("Error al hacer upsert:", upsertError);
      return;
    }

    setSummary({
      totalExcel: excelUsers.length,
      upserted: count ?? uniqueExcelUsers.length, // algunos planes de Supabase dev no devuelven count
    });

    setIsLoading(false);
  };

  const resetModal = () => {
    setSummary(null);
    setIsOpen(false);
    setIsLoading(false);
  };
  return (
    <>
      <button
        className="floating-upload-button"
        onClick={() => setIsOpen(true)}
      >
        +
      </button>

      {isOpen && (
        <div className="modal-overlay2" onClick={resetModal}>
          <div
            className="modal-content2"
            onClick={(e) => e.stopPropagation()} // para evitar que clic afuera lo cierre
          >
            <h2>Cargar usuarios desde Excel</h2>

            {!summary && (
              <>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  className="file-input"
                />
                {isLoading && (
                  <p className="loading-text">Procesando archivo...</p>
                )}
              </>
            )}

            {summary && (
              <div className="upload-summary">
                <p>
                  <strong>Total en archivo:</strong> {summary.totalExcel}
                </p>
                <p>
                  <strong>Registros insertados o actualizados:</strong>{" "}
                  {summary.upserted}
                </p>
              </div>
            )}

            <button className="modal-close-button2" onClick={resetModal}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
