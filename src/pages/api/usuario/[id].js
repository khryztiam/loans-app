// pages/api/usuario/[id].js

import { supabase } from '@/lib/supabase'; // Asegúrate de que esta ruta a 'supabase.js' sea correcta

export default async function handler(req, res) {
    // Solo manejaremos peticiones GET para buscar datos
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        // 405 Method Not Allowed
        return res.status(405).json({ error: 'Método no permitido. Solo se acepta GET.' });
    }

    // El ID que viene de la URL (req.query.id) es el SAPID
    const { id: sapidBuscado } = req.query; 

    if (!sapidBuscado) {
        // 400 Bad Request
        return res.status(400).json({ error: 'Falta el parámetro SAP ID de usuario.' });
    }

    try {
        // Ejecutar la consulta a Supabase
        const { data, error } = await supabase
            // 🛑 Reemplaza 'nombre_de_tu_tabla_usuarios' por 'users'
            .from('users') 
            // 🛑 Ajusta los campos a los nombres reales de tu tabla 'users'
            .select('sapid, nombre, descripcion, puesto') 
            .eq('sapid', sapidBuscado) // 'sapidBuscado' aquí es el SAPID buscado
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 es "No Rows Found"
            console.error('Error de Supabase:', error.message);
            // 500 Internal Server Error
            return res.status(500).json({ error: 'Error interno del servidor al consultar la base de datos.' });
        }

        if (!data) {
            // 404 Not Found
            return res.status(404).json({ error: `Usuario con SAP ID ${sapidBuscado} no encontrado.` });
        }

        // 200 OK: Devolver los datos del usuario
        return res.status(200).json({
            // Mapeamos los campos de la DB a los que espera el formulario
            sapid: data.sapid,
            nombre: data.nombre,
            puesto: data.puesto,
            departamento: data.descripcion // Mapeamos 'descripcion' a 'departamento' para el formulario
        });

    } catch (error) {
        console.error('Error inesperado:', error.message);
        // 500 Internal Server Error
        return res.status(500).json({ error: 'Error inesperado del servidor.' });
    }
}