import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase"; // Asegúrate de que esta ruta sea correcta

// Datos estáticos del sistema (Mejor mantenerlos fuera del componente)
const EQUIPO_OPTIONS = [
    { value: "Laptop", label: "Laptop" },
    { value: "Tablet", label: "Tablet" },
    { value: "Escáner", label: "Escáner" },
    { value: "Impresora", label: "Impresora" },
    { value: "Extensión", label: "Extensión (Cable, HUB, etc.)" },
    { value: "UPS", label: "UPS / Batería" },
];

export default function LoanRegisterModal({
    open,
    handleClose,
    mode = "entrega",
    selectedLoan = null,
    onSuccess,
}) {
    // 🛑 1. Unificar estados de SAPID y Usuario
    const [sapid, setSapid] = useState("");
    const [nombreRecibe, setNombreRecibe] = useState("");
    const [isUserLoading, setIsUserLoading] = useState(false);
    const [userNotFound, setUserNotFound] = useState(false);
    
    // Estados del préstamo
    const [diasPrestamo, setDiasPrestamo] = useState("");
    const [tipoEquipo, setTipoEquipo] = useState("");
    const [tag, setTag] = useState("");
    
    // Estados del formulario
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const sapidInputRef = useRef(null);
    const isEntrega = mode === "entrega";
    const isRecepcion = mode === "recepcion";

    // 🛑 2. Función de Búsqueda de Usuario Centralizada y Optimizada
    const searchUser = useCallback(async (cleanedSapid) => {
        setError("");
        setNombreRecibe("");
        setUserNotFound(false);
        
        if (!/^\d{8}$/.test(cleanedSapid)) {
            // No es un SAP ID válido de 8 dígitos
            return; 
        }

        setIsUserLoading(true);

        try {
            const { data, error } = await supabase
                .from("users")
                .select("nombre")
                .eq("sapid", cleanedSapid)
                .single();

            if (error || !data) {
                setNombreRecibe("Usuario no registrado");
                setUserNotFound(true);
                setError(`SAP ID ${cleanedSapid} no encontrado.`);
            } else {
                setNombreRecibe(data.nombre);
                setUserNotFound(false);
            }
        } catch (err) {
            console.error("Error al buscar usuario:", err);
            setError("Error interno al buscar el usuario.");
        } finally {
            setIsUserLoading(false);
        }
    }, []);

    // 🛑 3. Hook para manejar el SAPID, el escáner, y el enfoque
    useEffect(() => {
        // 3a. Lógica de Búsqueda al cambiar el SAPID (para escáneres)
        const delaySearch = setTimeout(() => {
            if (sapid.trim().length === 8) {
                searchUser(sapid.trim());
            }
        }, 300); // 300ms de debounce para escritura manual

        return () => clearTimeout(delaySearch);
    }, [sapid, searchUser]);

    // 3b. Enfocar y cargar datos iniciales (para Recepción)
    useEffect(() => {
        if (open) {
            if (sapidInputRef.current) {
                sapidInputRef.current.focus();
            }
            // Si es Recepción, precargamos el SAP ID del préstamo para referencia
            if (isRecepcion && selectedLoan) {
                 setSapid(selectedLoan.sapid_usuario || "");
                 // Y buscamos el nombre del usuario original que recibió el equipo
                 if (selectedLoan.sapid_usuario) {
                     searchUser(selectedLoan.sapid_usuario);
                 }
            } else {
                // Modo Entrega o modal vacío, reseteamos el formulario
                resetForm();
            }
        }
    // 🛑 Nota: No incluimos resetForm en las dependencias para evitar loops
    }, [open, isRecepcion, selectedLoan, searchUser]); 


    const resetForm = useCallback(() => {
        setSapid("");
        setNombreRecibe("");
        setDiasPrestamo("");
        setTipoEquipo("");
        setTag("");
        setError("");
        setUserNotFound(false);
        setLoading(false);
    }, []);

    // Función de cierre que resetea el formulario
    const handleCloseAndReset = useCallback(() => {
        resetForm();
        handleClose();
    }, [handleClose, resetForm]);

    // 🛑 La búsqueda de usuario ya NO se hace con Enter, sino en el useEffect.
    const handleSapidChange = (e) => {
        const value = e.target.value.trim();
        setSapid(value);
        
        // Limpiar el estado del usuario si el SAP ID cambia
        if (value.length !== 8) {
            setNombreRecibe("");
            setUserNotFound(false);
        }
    };

    // Maneja el envío del formulario
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        const cleanedSapid = sapid.trim();

        // 🛑 Validación final de SAP ID y Nombre
        if (userNotFound || isUserLoading || !nombreRecibe || nombreRecibe === "Usuario no registrado") {
            setError("Por favor, ingrese un SAP ID válido y espere la confirmación del nombre.");
            setLoading(false);
            return;
        }

        try {
            if (isEntrega) {
                // 🛑 MODO ENTREGA (Préstamo inicial)
                const { error } = await supabase.from("loans").insert([
                    {
                        sapid_usuario: cleanedSapid,
                        nombre_recibe: nombreRecibe, // Usar el nombre confirmado
                        dias_prestamo: parseInt(diasPrestamo),
                        tipo_equipo: tipoEquipo,
                        serie: tag,
                    },
                ]);

                if (error) throw error;
                
                alert("✅ Préstamo registrado con éxito.");

            } else if (isRecepcion && selectedLoan) {
                // 🛑 MODO RECEPCIÓN (Entrega de vuelta)
                
                // Nota: El usuario que 'recibe' la devolución es el IT/Admin, 
                // por lo que el nombreRecibe es el nombre de quien hace la devolución (el asociado)
                
                const { error } = await supabase
                    .from("loans")
                    .update({
                        received_at: new Date().toISOString(),
                        // Quien hace la recepción (IT/Admin)
                        sapid_recepcion: cleanedSapid, 
                        nombre_entrega: nombreRecibe, // 🛑 Nombre de la persona de IT que registra la recepción
                        // Asegúrate de que tu tabla 'loans' tiene 'nombre_recepcion'
                    })
                    .eq("id", selectedLoan.id);

                if (error) throw error;
                
                alert(`✅ Recepción del equipo ${selectedLoan.serie} registrada.`);
            }

            handleCloseAndReset();
            if (onSuccess) onSuccess();
            
        } catch (error) {
            setError(
                isEntrega
                    ? "Error al registrar el préstamo."
                    : "Error al registrar la recepción."
            );
            console.error("Error en el formulario:", error);
        } finally {
            setLoading(false);
        }
    };

    // Manejo de teclado (Escape)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                handleCloseAndReset();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleCloseAndReset]); 

    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={handleCloseAndReset}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>
                    {isEntrega
                        ? "Registrar nuevo préstamo"
                        : "Registrar recepción de equipo"}
                </h2>
                {isRecepcion && selectedLoan && (
                    <p className="loan-info-header">
                        Devolución del equipo **{selectedLoan.serie}** (Prestado a {selectedLoan.nombre_recibe || 'N/A'})
                    </p>
                )}
                
                <form onSubmit={handleSubmit}>
                    <label htmlFor="sapid-input">
                        SAP ID del {isRecepcion ? "Usuario que entrega" : "Usuario"}
                    </label>
                    <input
                        id="sapid-input"
                        type="text"
                        value={sapid}
                        onChange={handleSapidChange} // 🛑 Usamos el nuevo handler
                        maxLength={8}
                        required
                        ref={sapidInputRef}
                        disabled={loading || isUserLoading}
                    />

                    <label>Nombre</label>
                    <input
                        type="text"
                        value={isUserLoading ? "Buscando..." : nombreRecibe}
                        disabled
                        className={userNotFound ? "error" : ""}
                    />
                    
                    {error && sapid.length === 8 && <p className="error-text">{error}</p>}
                    
                    {isEntrega && (
                        <>
                            <label>Días de préstamo</label>
                            <input
                                type="number"
                                value={diasPrestamo}
                                onChange={(e) => setDiasPrestamo(e.target.value)}
                                required
                                min="1" // 🛑 Mínimo 1 día
                            />

                            <label>Tipo de equipo</label>
                            <select
                                value={tipoEquipo}
                                onChange={(e) => setTipoEquipo(e.target.value)}
                                required
                            >
                                <option value="">Selecciona un tipo</option>
                                {EQUIPO_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>

                            <label>Serie de equipo (TAG)</label>
                            <input
                                type="text"
                                value={tag}
                                onChange={(e) => setTag(e.target.value.toUpperCase())} // 🛑 Uppercase para TAG
                                required
                            />
                        </>
                    )}

                    {isRecepcion && selectedLoan && (
                        <>
                            <p className="loan-detail">
                                **Equipo:** {selectedLoan.tipo_equipo} / **TAG:** {selectedLoan.serie}
                            </p>
                            <p className="loan-detail">
                                **Fecha Préstamo:**{" "}
                                {new Date(selectedLoan.created_at).toLocaleString('es-ES', { 
                                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                })}
                            </p>
                            <small>
                                Confirme el SAP ID que registra la devolución.
                            </small>
                        </>
                    )}

                    <button 
                        type="submit" 
                        disabled={
                            loading || 
                            isUserLoading || 
                            userNotFound || 
                            !nombreRecibe || 
                            (isEntrega && (!diasPrestamo || !tipoEquipo || !tag))
                        }
                    >
                        {loading
                            ? "Guardando..."
                            : isEntrega
                            ? "Registrar préstamo"
                            : "Confirmar recepción"}
                    </button>
                </form>
            </div>
        </div>
    );
}