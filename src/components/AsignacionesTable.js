// components/AsignacionesTable.js
import { useRouter } from 'next/router'; // 🛑 Importar useRouter

export default function AsignacionesTable({ data, onEdit }) {
    const router = useRouter(); // 🛑 Inicializar useRouter

    if (!data || data.length === 0) {
        return <p>No hay equipos asignados registrados.</p>;
    }

    // 🛑 FUNCIÓN MODIFICADA: Ahora navega a la página de Previsualización
    const handlePreviewPdf = (id) => {
        // Navegamos a la página /busqueda y pasamos el ID como query parameter
        router.push(`/busqueda?id=${id}`);
    };

    // Función para manejar la descarga directa del PDF (opcional, pero útil)
    const handleDownloadPdf = (id) => {
        const pdfUrl = `/api/pdf/${id}`;
        window.open(pdfUrl, '_blank');
    };

    return (
        <div className="table-responsive">
            <table className="assignments-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Usuario</th>
                        <th>Equipo</th>
                        <th>Tag/Serie</th>
                        <th>Detalles</th>
                        <th>Fecha Asignación</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item) => (
                        <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.usuario}</td>
                            <td>{item.equipo}</td>
                            <td>{item.tag}</td>
                            <td>{item.detalles}</td>
                            <td>{item.fecha}</td>
                            <td>
                                {/* 🛑 NUEVO BOTÓN: Previsualizar/Imprimir (navega a /busqueda) */}
                                <button 
                                    className="preview-button" 
                                    onClick={() => handlePreviewPdf(item.id)} // 🛑 Usamos la nueva función
                                >
                                    Previsualizar/Imprimir
                                </button>
                                
                                {/* Botón de Exportar/Descarga Directa (Opcional, si lo quieres mantener) 
                                <button 
                                    className="export-pdf-button" 
                                    onClick={() => handleDownloadPdf(item.id)}
                                >
                                    Descargar PDF
                                </button> */}
                                
                                {/* Botón de Edición (Opcional) */}
                                {onEdit && (
                                    <button 
                                        className="edit-button" 
                                        onClick={() => onEdit(item.id)}
                                    >
                                        Editar
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}