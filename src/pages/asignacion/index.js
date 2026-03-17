// pages/asignacion/index.js

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { RootLayout } from "@/components/layout/RootLayout";
import AsignacionForm from "@/components/AsignacionForm";
import AsignacionesTable from "@/components/AsignacionesTable";

export default function AsignacionPage() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [asignaciones, setAsignaciones] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const fetchAsignaciones = useCallback(async () => {
    // IMPORTANTE: Asegúrate que 'asignaciones_permanentes' es el nombre de tu tabla
    const { data: asignacionesData, error: asignacionesError } = await supabase
      .from("asignaciones_permanentes")
      .select(`id, sapid, fecha_asignacion, modelo, serie, detalles`)
      .order("id", { ascending: false });

    if (asignacionesError) {
      console.error("Error al obtener asignaciones:", asignacionesError);
      // Mostrar un error en la interfaz si es necesario
      return;
    }

    // 2. OBTENER NOMBRES DE USUARIOS EN MASA (si hay datos)
    if (asignacionesData.length > 0) {
      // Obtenemos todos los SAPIDs únicos de los resultados
      const uniqueSapids = [
        ...new Set(asignacionesData.map((item) => item.sapid)),
      ];

      // Consultamos la tabla 'users' para obtener los nombres correspondientes
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("sapid, nombre")
        .in("sapid", uniqueSapids); // Usamos el filtro 'in' para buscar múltiples SAPIDs

      if (usersError) {
        console.error("Error al obtener nombres de usuarios:", usersError);
        // Si esto falla, todavía podemos mostrar los datos de asignación sin nombre.
      }

      // 3. MAPEO Y FORMATO DE DATOS
      const usersMap = usersData.reduce((map, user) => {
        map[user.sapid] = user.nombre;
        return map;
      }, {});

      const formattedData = asignacionesData.map((item) => ({
        id: item.id,
        // Usamos el mapa para buscar el nombre por SAPID
        usuario: usersMap[item.sapid] || "Usuario Desconocido",
        equipo: item.modelo,
        tag: item.serie,
        fecha: item.fecha_asignacion,
        detalles: item.detalles,
      }));

      setAsignaciones(formattedData);
    }
  }, []);

  useEffect(() => {
    fetchAsignaciones();
  }, [fetchAsignaciones]);

  return (
    <RootLayout>
      <ProtectedLayout>
        <div className="assignment-management-container">
          <h2>Gestión y Consulta de Asignaciones</h2>

          {/* Sección de Acción: Botón para abrir el formulario */}
          <div className="action-buttons-bar">
            <button
              className="new-assignment-button"
              onClick={() => {
                setEditingId(null);
                setIsFormOpen(true);
              }}
            >
              + Nueva Asignación
            </button>
          </div>

          {/* Vista de la Tabla de Asignaciones */}
          <section className="asignaciones-list">
            <h3>Equipos Asignados (Permanentes)</h3>
            <p>Listado de activos actualmente en posesión de usuarios.</p>
            <AsignacionesTable
              data={asignaciones}
              onEdit={(id) => {
                setEditingId(id);
                setIsFormOpen(true);
              }}
            />
          </section>

          {/* Formulario de Asignación */}
          {isFormOpen && (
            <div className="modal-overlay" onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsFormOpen(false);
              }
            }}>
              <div className="modal-content">
                <h3>
                  {editingId ? "Editar Asignación" : "Registrar Nueva Asignación"}
                </h3>
                <AsignacionForm
                  assignmentId={editingId}
                  onSuccess={() => {
                    setIsFormOpen(false);
                    setEditingId(null);
                    fetchAsignaciones();
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </ProtectedLayout>
    </RootLayout>
  );
}
