// pages/api/asignar.js

import { supabase } from "@/lib/supabase"; // Asegúrate de que esta ruta sea correcta
import PDFDocument from "pdfkit"; // Librería necesaria para generar PDF en el backend (ejemplo conceptual)
import { Writable } from "stream";

// --- FUNCIÓN DE GENERACIÓN DE PDF ---
// Esta función debe ser robusta y generará el PDF acta.
async function generateAssignmentPdf(assignmentData) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers = [];
        
        const stream = new Writable({
            write(chunk, encoding, callback) {
                buffers.push(chunk);
                callback();
            },
            final(callback) {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
                callback();
            }
        });
        
        doc.pipe(stream);

        // --- ENCABEZADO Y TÍTULOS (Simulación del formato) ---
        
        // Simular el Logo/Título Principal
        doc.fontSize(16).font('Helvetica-Bold').text('YNCA Business Management Systems', 150, 50, { align: 'center' });

        // Simular las cajas de la esquina superior derecha
        doc.rect(400, 35, 150, 15).stroke();
        doc.fontSize(8).font('Helvetica-Bold').text('Region / Dept.', 405, 38);
        doc.fontSize(10).font('Helvetica').text(assignmentData.userInfo.departamento, 405, 50);

        doc.rect(400, 55, 150, 15).stroke();
        doc.fontSize(8).font('Helvetica-Bold').text('YNCA / Information Technology', 405, 58);

        doc.rect(400, 75, 150, 15).stroke();
        doc.fontSize(8).font('Helvetica-Bold').text('Revision Date:', 405, 78);
        doc.fontSize(10).font('Helvetica').text('2016-OCT-07', 405, 90); // Valor fijo de la plantilla

        // Título del Formulario
        doc.fontSize(14).font('Helvetica-Bold').text('Assigning IT Assets to Associates Form', 150, 120);
        doc.moveDown(1);
        
        // --- TEXTO LEGAL Y CUERPO (Simulación del formato) ---
        const textoLegal = 
            'I acknowledge the receipt of the following equipment from the Department of Information Technology for which I am responsible for. These responsibilities include but are not limited to following the guidelines listed in corporate policy AA-IT-xx-Y-017 IT Equipment and Network Access Policy. I also understand I must present this equipment for all physical inventory processes and software audits, assure computer will be on the network to receive service packs and virus updates a minimum of every 30 days, and to report the theft or loss of equipment to the IT Department. In the event you cannot produce physical verification of an asset (after two physical inventories) you are responsible to complete an asset disposal form.';
            
        doc.fontSize(9).font('Helvetica').text(textoLegal, 50, 150, { align: 'justify' });
        doc.moveDown(1);
        
        doc.fontSize(10).font('Helvetica-Bold').text('Hardware Description:', 50, doc.y);
        doc.moveDown(0.5);
        
        // --- DETALLES DEL EQUIPO (Variables) ---
        
        // Simular las líneas de datos
        doc.font('Helvetica-Bold').text('Equipo/Modelo:', 55, doc.y);
        doc.font('Helvetica').text(assignmentData.modeloEquipo, 170, doc.y);
        doc.moveDown(0.5);

        doc.font('Helvetica-Bold').text('Serial number:', 55, doc.y);
        // Aquí puedes decidir si mapeas el Fixed Asset Tag (serie) o el Serial Number si son diferentes.
        // Asumimos que la "Serie" es el Serial Number/TAG que ingresa el usuario.
        doc.font('Helvetica').text(assignmentData.serie, 170, doc.y);
        doc.moveDown(0.5);
        
        doc.font('Helvetica-Bold').text('Accesorios:', 55, doc.y);
        doc.font('Helvetica').text(assignmentData.accesorios.join(', '), 170, doc.y);
        doc.moveDown(0.5);

        doc.font('Helvetica-Bold').text('Fixed Asset Tag Number:', 55, doc.y);
        doc.font('Helvetica').text(assignmentData.serie, 170, doc.y); // Se usa la misma serie/tag
        doc.moveDown(1.5);
        
        // --- INFORMACIÓN DEL ASIGNADO Y FECHAS ---
        
        doc.font('Helvetica-Bold').text('Associates Printed Name:', 55, doc.y);
        doc.font('Helvetica').text(assignmentData.userInfo.nombre, 170, doc.y);
        doc.moveDown(0.5);

        doc.font('Helvetica-Bold').text('Location:', 55, doc.y);
        doc.font('Helvetica').text(assignmentData.localidad, 170, doc.y);
        doc.moveDown(0.5);

        doc.font('Helvetica-Bold').text('Date:', 55, doc.y);
        doc.font('Helvetica').text(assignmentData.fecha_asignacion, 170, doc.y); // Fecha de asignación
        doc.moveDown(3);

        // --- PIE DE PÁGINA Y FIRMAS ---

        // Simular la fecha de impresión en la esquina inferior derecha
        const printDate = new Date().toLocaleDateString('es-ES');
        doc.fontSize(9).font('Helvetica-Bold').text('Print Date:', 400, doc.page.height - 50);
        doc.font('Helvetica').text(printDate, 450, doc.page.height - 50);
        
        doc.end();
    });
}
// --- FIN FUNCIÓN DE GENERACIÓN DE PDF ---

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Método no permitido. Solo se acepta POST.' });
    }

    try {
        const formData = req.body;
        
        // 1. VALIDACIÓN
        if (!formData.sapid || !formData.modeloEquipo || !formData.serie) {
            return res.status(400).json({ error: 'Faltan datos requeridos (SAP ID, Modelo o Serie).' });
        }
        
        // 2. OBTENER INFORMACIÓN COMPLETA DEL USUARIO PARA EL PDF
        // Necesitamos el nombre, puesto y departamento (descripcion) para el acta.
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('nombre, descripcion, puesto')
            .eq('sapid', formData.sapid)
            .single();
            
        if (userError || !userData) {
             return res.status(404).json({ error: 'No se pudo obtener la información completa del usuario para el acta.' });
        }


        // 3. INSERTAR DATOS EN SUPABASE (Punto 5)
        const { data: asignacionData, error: dbError } = await supabase
            .from('asignaciones_permanentes') 
            .insert({
                sapid: formData.sapid,
                modelo: formData.modeloEquipo,
                serie: formData.serie,
                detalles: formData.accesorios, // Se inserta como JSONB
                fecha_asignacion: formData.fecha_asignacion,
                localidad: formData.localidad,
            })
            .select()
            .single();

        if (dbError) {
            console.error('Error de Supabase al insertar:', dbError);
            return res.status(500).json({ error: 'Error al guardar la asignación en la base de datos.', details: dbError.message });
        }

        const asignacionId = asignacionData.id;

        // 4. GENERAR EL PDF (Punto 6)
        const pdfData = { 
            ...formData, 
            asignacionId,
            userInfo: {
                nombre: userData.nombre,
                puesto: userData.puesto,
                departamento: userData.descripcion // Mapeo para el PDF
            }
        };

        const pdfBuffer = await generateAssignmentPdf(pdfData);

        // 5. ENVIAR EL PDF AL CLIENTE
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Acta_Asignacion_${asignacionId}_${formData.sapid}.pdf`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        res.end(pdfBuffer);

    } catch (error) {
        console.error('Error general al procesar la asignación:', error.message);
        return res.status(500).json({ error: 'Error inesperado al procesar la solicitud.', details: error.message });
    }
}