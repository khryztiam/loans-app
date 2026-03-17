// components/AsignacionForm.js
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Si el formulario se usa en un modal, necesita onSuccess para cerrarse
export default function AsignacionForm({ assignmentId, onSuccess }) {
  // Estado para la interfaz y carga
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingData, setLoadingData] = useState(false); // 🛑 Nuevo estado de carga inicial

  // Estado inicial de la data que se va a enviar a la DB
  const [formData, setFormData] = useState({
    userIdInput: "", // Campo temporal para buscar el SAPID
    sapid: null, // SAPID del usuario encontrado (clave para la asignación)
    modeloEquipo: "",
    serie: "", // <-- NUEVO: Número de Serie del Equipo
    localidad: "", // <-- NUEVO: Localidad de la Asignación
    accesorios: [], // Array de accesorios/detalles seleccionados
    fecha_asignacion: new Date().toISOString().substring(0, 10),
  });

  // Datos estáticos de ejemplo (IDEALMENTE CARGADOS DE SUPABASE en el componente padre)
  const modelos = [
    "LATITUDE 5420",
    "LATITUDE 5430",
    "LATITUDE 5440",
    "LATITUDE 5450",
    "LATITUDE 5480",
    "LATITUDE 5490",
    "OPTIPLEX 3000",
    "OPTIPLEX 7010",
    "OPTIPLEX 7020",
  ];
  const localidades = ["Santa Ana", "Rinconcito", "Intercomplex"]; // <-- NUEVO: Localidades
  const detallesDisponibles = [
    "MOUSE WIRELESS",
    "KEYBOARD WIRELESS",
    "CARGADOR",
    "MOCHILA",
    "MOUSE",
    "TECLADO",
    "COVER",
    "STYLUS",
  ];

  // 🛑 LÓGICA DE CARGA DE DATOS EXISTENTES (Modo Edición)
  // -----------------------------------------------------------
  useEffect(() => {
    const fetchExistingAssignment = async () => {
      if (!assignmentId) {
        // Modo Creación: aseguramos que los campos de búsqueda estén vacíos
        setFormData((prev) => ({
          ...prev,
          userIdInput: "",
          sapid: null,
          modeloEquipo: "",
          serie: "",
          accesoridad: "",
          accesorios: [],
        }));
        setUserInfo(null);
        return;
      }

      setLoadingData(true);
      setError(null);

      // --- 1. Carga de Asignación por ID ---
      const { data: assignment, error: assignError } = await supabase
        .from("asignaciones_permanentes")
        .select(
          `sapid, modelo, serie, accesorios, localidad, fecha_asignacion`
        ) // 🛑 Alias para mapear 'fechaEntrega'
        .eq("id", assignmentId)
        .single();

      if (assignError || !assignment) {
        console.error("Error al cargar la asignación:", assignError);
        setError("No se pudo cargar el registro de asignación.");
        setLoadingData(false);
        return;
      }

      // --- 2. Carga de Información de Usuario por SAPID (como en tu lógica de búsqueda) ---
      const { data: userData } = await supabase
        .from("users")
        .select("nombre, puesto, departamento, sapid")
        .eq("sapid", assignment.sapid)
        .limit(1);

      const user = userData?.[0];

      // 3. Actualizar el estado del formulario con los datos cargados
      setFormData({
        // Estos son los datos para el formulario y el envío
        sapid: assignment.sapid,
        modeloEquipo: assignment.modelo, // Asume que 'modelo' en DB es 'modeloEquipo' en el estado
        serie: assignment.serie,
        localidad: assignment.localidad,
        // Si la DB guarda la fecha con timestamp, la cortamos para el input type="date"
        fecha_asignacion: assignment.fecha_asignacion
          ? assignment.fecha_asignacion.substring(0, 10)
          : new Date().toISOString().substring(0, 10),
        // Asegurar que accesorios es un array, si se guardó como JSON o string
        accesorios: Array.isArray(assignment.accesorios)
          ? assignment.accesorios
          : assignment.accesorios
          ? [assignment.accesorios]
          : [],

        // Este campo es temporal para la interfaz de búsqueda, debe ser el SAPID
        userIdInput: assignment.sapid.toString(),
      });

      // 4. Actualizar el estado de la interfaz del usuario
      if (user) {
        setUserInfo(user);
      } else {
        setUserInfo({
          nombre: "Usuario Desconocido",
          puesto: "N/A",
          departamento: "N/A",
          sapid: assignment.sapid,
        });
      }

      setLoadingData(false);
    };

    fetchExistingAssignment();
  }, [assignmentId]); // Se ejecuta cada vez que el ID de edición cambia

  // -----------------------------------------------------------
  // Lógica de búsqueda de usuario (Punto 1)
  // -----------------------------------------------------------
  const handleSearchUser = async (e) => {
    e.preventDefault();
    setError(null);
    setUserInfo(null);

    const idToSearch = formData.userIdInput.trim();
    if (!idToSearch) {
      setError("Por favor ingrese un SAP ID de usuario.");
      return;
    }

    setIsLoading(true);

    try {
      // Llama a la API Route: /api/usuario/[sapid]
      const response = await fetch(`/api/usuario/${idToSearch}`);

      if (!response.ok) {
        // Si la respuesta no es 200 (ej. 404 No encontrado)
        throw new Error(
          "Usuario no encontrado o error en el servidor. Revise el SAP ID."
        );
      }

      const data = await response.json();

      if (data.sapid) {
        setUserInfo(data);
        // 🛑 Actualiza el SAPID en el estado del formulario (clave para la DB)
        setFormData((prev) => ({ ...prev, sapid: data.sapid }));
      } else {
        setError("SAP ID no encontrado en la base de datos de usuarios.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------------------------------------
  // Lógica de Manejo de Entradas
  // -----------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejo especial para selección múltiple de detalles/accesorios
  const handleDetallesChange = (e) => {
    const selectedOptions = Array.from(e.target.options)
      .filter((option) => option.selected)
      .map((option) => option.value);

    setFormData((prev) => ({
      ...prev,
      accesorios: selectedOptions,
    }));
  };

  // -----------------------------------------------------------
  // 🛑 Lógica de Envío del Formulario (Ajuste para UPDATE)
  // -----------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.sapid || !formData.modeloEquipo || !formData.serie) {
      alert(
        "Por favor, busque un usuario y complete los campos de Equipo y Serie."
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    // Preparamos los datos para la DB
    const dataToSubmit = {
      sapid: formData.sapid,
      modelo: formData.modeloEquipo, // Asegúrate de que el campo de la DB sea 'modelo'
      serie: formData.serie,
      localidad: formData.localidad,
      detalles: formData.detalles,
      fecha_asignacion: formData.fecha_asignacion,
      // No enviamos userIdInput, userName, etc.
    };

    let supabaseQuery;
    let successMessage;

    if (assignmentId) {
      // --- MODO EDICIÓN (UPDATE) ---
      supabaseQuery = supabase
        .from("asignaciones_permanentes")
        .update(dataToSubmit)
        .eq("id", assignmentId) // Filtramos por el ID del registro
        .select() // Para obtener el registro actualizado
        .single();

      successMessage = "✅ Asignación actualizada con éxito.";
    } else {
      // --- MODO CREACIÓN (INSERT) ---
      supabaseQuery = supabase
        .from("asignaciones_permanentes")
        .insert([dataToSubmit])
        .select() // Para obtener el registro recién creado
        .single();

      successMessage = "✅ Asignación guardada y descarga del PDF iniciada.";
    }

    try {
      const { data: savedData, error: dbError } = await supabaseQuery;

      if (dbError) {
        throw new Error(dbError.message || "Error al guardar la asignación.");
      }

      // Si es un nuevo registro, se puede hacer la redirección o el PDF aquí
      // (La lógica para la API /api/asignar que tenías antes era correcta para creación,
      // pero para edición a veces se maneja diferente).

      // Si la descarga (o la redirección) fue exitosa:
      alert(successMessage);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------------------------------------
  // Renderizado del Formulario
  // -----------------------------------------------------------

  if (loadingData) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Cargando datos para edición...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="assignment-form-content">
      {error && <p className="error-message error-box">{error}</p>}

      {/* 1. SECCIÓN DE USUARIO (Punto 1) */}
      <fieldset disabled={isLoading}>
        <h3 style={{ padding: "5px 10px 0" }}>Identificación del Usuario</h3>
        <div className="form-group user-search">
          <label htmlFor="userIdInput">SAP ID:</label>
          <input
            type="text"
            id="userIdInput"
            name="userIdInput"
            value={formData.userIdInput}
            onChange={handleChange}
            placeholder="Escanear o ingresar SAP ID"
            required
          />
          <button onClick={handleSearchUser} disabled={isLoading}>
            {isLoading ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {userInfo && (
          <div className="user-details success-box">
            <h4>Usuario Encontrado:</h4>
            <p>
              <strong>Nombre:</strong> {userInfo.nombre}
            </p>
            <p>
              <strong>Puesto:</strong> {userInfo.puesto}
            </p>
            <p>
              <strong>Departamento:</strong> {userInfo.departamento}
            </p>
            <small>
              El SAP ID ({userInfo.sapid}) será usado para el registro.
            </small>
          </div>
        )}
      </fieldset>

      {/* 2. SECCIÓN DE EQUIPO Y DETALLES */}
      {/* Solo se habilita si ya encontramos un usuario */}
      <fieldset
        disabled={isLoading || loadingData || !formData.sapid} // 🛑 Añadimos loadingData
        className="form-section"
      >
        <h3>Detalles del Equipo</h3>

        {/* Selección de Modelo (Punto 2) */}
        <div className="form-group">
          <label htmlFor="modeloEquipo">Modelo de Equipo:</label>
          <select
            id="modeloEquipo"
            name="modeloEquipo"
            value={formData.modeloEquipo}
            onChange={handleChange}
            required
          >
            <option value="">-- Seleccione un equipo --</option>
            {modelos.map((modelo) => (
              <option key={modelo} value={modelo}>
                {modelo}
              </option>
            ))}
          </select>
        </div>

        {/* 🛑 Agrupamos Serie y Localidad en una fila (usaremos CSS para que estén lado a lado) */}
        <div className="form-row-group">
          <div className="form-group half-width">
            <label htmlFor="serie">Número de Serie (Tag):</label>
            <input
              type="text"
              id="serie"
              name="serie"
              value={formData.serie}
              onChange={handleChange}
              placeholder="Escanear o ingresar la serie del equipo"
              required
            />
          </div>

          <div className="form-group half-width">
            <label htmlFor="localidad">Localidad de la Asignación:</label>
            <select
              id="localidad"
              name="localidad"
              value={formData.localidad}
              onChange={handleChange}
              required
            >
              <option value="">-- Seleccione localidad --</option>
              {localidades.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selección de Detalles/Accesorios (Punto 3) */}
        <div className="form-group">
          <label htmlFor="detallesAccesorios">Accesorios Entregados:</label>
          <select
            id="detallesAccesorios"
            name="detalles"
            multiple // <-- Clave para la selección múltiple
            size={5} // <-- Muestra 5 elementos a la vez (ajusta según necesidad)
            value={formData.detalles}
            onChange={handleDetallesChange}
            // Nota: El campo 'required' no funciona bien con multiple,
            // la validación debe hacerse al enviar.
          >
            {detallesDisponibles.map((detalle) => (
              <option key={detalle} value={detalle}>
                {detalle}
              </option>
            ))}
          </select>
          <small>
            Presione **Ctrl/Cmd** para seleccionar múltiples elementos.
          </small>
        </div>

        {/* Fecha de Entrega (Punto 4) */}
        <div className="form-group">
          <label htmlFor="fecha_asignacion">Fecha de Entrega:</label>
          <input
            type="date"
            id="fecha_asignacion"
            name="fecha_asignacion"
            value={formData.fecha_asignacion}
            onChange={handleChange}
            max={new Date().toISOString().substring(0, 10)}
            required
          />
        </div>
      </fieldset>

      {/* 3. BOTÓN DE GUARDAR */}
      <div className="form-actions">
        <button
          type="submit"
          disabled={
            isLoading ||
            loadingData ||
            !formData.sapid ||
            !formData.modeloEquipo ||
            !formData.serie
          }
        >
          {
            assignmentId
              ? isLoading
                ? "Actualizando..."
                : "Guardar Cambios"
              : isLoading
              ? "Guardando..."
              : "Guardar Asignación y Generar PDF" // 🛑 Texto según el modo
          }
        </button>
      </div>
    </form>
  );
}
