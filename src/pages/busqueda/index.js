import AssigningITAssetsForm from "@/components/ResponsivePDF";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function BusquedaPage() {
  // --- Lógica de Autenticación (Asegúrate de tenerla en todas las páginas) ---
  const router = useRouter();
  const { id } = router.query;
  const [assignmentData, setAssignmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      // 🛑 Convertir el ID a número (si es numérico en la base de datos)
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        setError("ID de asignación inválido.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // 1. OBTENER TODOS LOS DATOS DE LA ASIGNACIÓN (incluye el SAPID)
      const { data: assignment, error: assignError } = await supabase
        .from("asignaciones_permanentes") // 🛑 MÁS LIMPIO Y SEGURO: Usar una cadena de texto plana
        .select("sapid, modelo, serie, detalles, localidad, fecha_asignacion")
        .eq("id", numericId)
        .single();

      if (assignError || !assignment) {
        console.error(
          "Error en la primera consulta (asignación):",
          assignError
        );
        // Si el error es 406 (sin resultados), Supabase aún devuelve error, pero la asignación es null
        setError("Error al cargar datos o asignación no encontrada.");
        setLoading(false);
        return;
      }

      // --- 2. BUSCAR EL NOMBRE Y DEPARTAMENTO DEL USUARIO USANDO EL SAPID ---

      // Usamos .limit(1) para evitar el fallo de .single() si el registro no existe
      const { data: userData } = await supabase
        .from("users")
        .select("nombre")
        .eq("sapid", assignment.sapid)
        .limit(1);

      const user = userData?.[0]; // Tomamos el primer resultado o es 'undefined'

      // 3. Mapeo y Formato de Datos con Fallback

      // Configuramos el fallback si no se encuentra el usuario en la tabla 'users'
      const userInfo = user
        ? {
            nombre: user.nombre,
          }
        : {
            nombre: "Usuario Desconocido (SAPID: " + assignment.sapid + ")",
          };

      const formattedData = {
        userInfo: userInfo,
        modelo: assignment.modelo,
        serie: assignment.serie,
        detalles: assignment.detalles,
        localidad: assignment.localidad,
        // Formatear la fecha
        fecha_asignacion: new Date(
          assignment.fecha_asignacion
        ).toLocaleDateString("es-ES"),
      };

      setAssignmentData(formattedData);
      setLoading(false);
      // El error de usuario (userError) no detiene la renderización, solo usa el fallback
    };

    fetchData();
  }, [id]);

  if (loading)
    return <div className="loading-preview">Cargando Formulario...</div>;
  if (error) return <div className="error-preview">Error: {error}</div>;

  return (
    <div className="preview-page">
      <div className="print-controls">
        <button onClick={() => window.print()} className="print-button">
          🖨️ Imprimir Formulario
        </button>
        <button onClick={() => router.back()} className="back-button">
          ⬅️ Regresar a Asignaciones
        </button>
      </div>
      <AssigningITAssetsForm assignmentData={assignmentData} />
    </div>
  );
}
