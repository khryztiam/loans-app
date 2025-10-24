// pages/asignacion/index.js

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Asegúrate de la ruta de Supabase
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import AsignacionForm from "@/components/AsignacionForm"; // Componente del formulario de asignación
import AsignacionesTable from "@/components/AsignacionesTable"; // Componente de la tabla

export default function AsignacionPage() {
  const [isFormOpen, setIsFormOpen] = useState(false); // <--- Estado para el modal
  const [asignaciones, setAsignaciones] = useState([]); // <--- Estado para los datos reales
  const [editingId, setEditingId] = useState(null);

  // --- Lógica de Autenticación (Asegúrate de tenerla en todas las páginas) ---
  const [user, setUser] = useState(null);
  const router = useRouter();

  const fetchUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser(data.user);
    } else {
      router.push("/");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  useEffect(() => {
    fetchUser();
  }, [router]);
  // --------------------------------------------------------------------------

  // --- Lógica para cargar los registros (Sustituye a los datos de ejemplo) ---
  const fetchAsignaciones = async () => {
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
  };

  useEffect(() => {
    fetchAsignaciones();
    // Nota: Idealmente, agregarías aquí la suscripción en tiempo real de Supabase
  }, []);
  // --------------------------------------------------------------------------

  // Si el usuario no está autenticado, puedes renderizar null o un loader
  if (!user) return <p>Cargando...</p>;

  const handleEdit = (id) => {
    setEditingId(id); // Guarda el ID del registro a editar
    setIsFormOpen(true); // Abre el modal/formulario
    // Nota: Dentro de AsignacionForm, necesitarás usar editingId para cargar
    // los datos y determinar si estás en modo "Crear" o "Editar".
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsFormOpen(false);
    }
  };

  return (
    // Pasamos user y handleLogout al Layout
    <Layout user={user} handleLogout={handleLogout} sidebar={null}>
      <div className="assignment-management-container">
        <h2>Gestión y Consulta de Asignaciones</h2>

        {/* Sección de Acción: Botón para abrir el formulario */}
        <div className="action-buttons-bar">
          <button
            className="new-assignment-button"
            onClick={() => {
              setEditingId(null); // Asegura modo creación
              setIsFormOpen(true);
            }}
          >
            + Nueva Asignación
          </button>
        </div>

        {/* 1. Vista de la Tabla de Asignaciones (el listado) */}
        <section className="asignaciones-list">
          <h3>Equipos Asignados (Permanentes)</h3>
          <p>Listado de activos actualmente en posesión de usuarios.</p>
          <AsignacionesTable data={asignaciones} onEdit={handleEdit} />
        </section>
      </div>

      {/* 2. El Formulario de Asignación (Renderizado Condicional) */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="modal-content">
            <h3>
              {editingId ? "Editar Asignación" : "Registrar Nueva Asignación"}
            </h3>
            <AsignacionForm
              assignmentId={editingId} // 🛑 Pasa el ID al formulario
              onSuccess={() => {
                // Función que se llama al guardar con éxito
                setIsFormOpen(false);
                setEditingId(null); // Resetear el estado de edición
                fetchAsignaciones(); // Recargar la tabla
              }}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}
