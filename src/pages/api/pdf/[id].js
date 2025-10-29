// pages/api/pdf/[id].js

import { supabase } from "@/lib/supabase";
import PDFDocument from "pdfkit";
import { Writable } from "stream";
import path from "path";

// --- FUNCIÓN DE GENERACIÓN DE PDF (INTEGRADA) ---
async function generateAssignmentPdf(assignmentData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers = [];

    // Configuración de la Stream para capturar el PDF como Buffer
    const stream = new Writable({
      write(chunk, encoding, callback) {
        buffers.push(chunk);
        callback();
      },
      final(callback) {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
        callback();
      },
    });

    doc.pipe(stream);

    // --- CONTENIDO DEL PDF AJUSTADO A LA PLANTILLA ---

    // Variables de fecha formateada
    const printDate = new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const fechaAsignacion = new Date(
      assignmentData.fecha_asignacion
    ).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // --- 1. ENCABEZADO Y CAJAS SUPERIORES (Imitando la plantilla) ---

    // Coordenadas iniciales para la estructura de la derecha
    const boxX = 400;
    const boxWidth = 150;
    let currentY = 35; // Altura inicial de la primera caja

    // YNCA Business Management Systems (Texto Central)
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("YNCA Business Management Systems", 100, 50, {
        width: 300,
        align: "left",
      });

    // 🛑  (Si tuvieras un logo, lo pondrías aquí usando doc.image)
    const logoPath = path.join(
      process.cwd(),
      "public",
      "yazaki-logo.jpg"
    );

    try {
      doc.image(
        logoPath,
        50, // X-coordinate
        30, // Y-coordinate (ajustar para que quede alto)
        {
          width: 40, // Ancho deseado del logo
          height: 20,
        }
      );
    } catch (e) {
      console.warn(
        "Advertencia: No se pudo cargar el logo Yazaki. Asegúrese de que el archivo exista en la ruta:",
        logoPath,
        e
      );
      // Dejar un placeholder si la carga falla
      doc.fontSize(12).font("Helvetica-Bold").text("YAZAKI", 50, 40);
    }

    // --- CAJA SUPERIOR DERECHA: Region / Dept. ---
    doc.rect(boxX, currentY, boxWidth, 15).stroke();
    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("Region / Dept.", boxX + 5, currentY + 3);
    currentY += 15;
    doc.rect(boxX, currentY, boxWidth, 15).stroke();
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(assignmentData.userInfo.departamento, boxX + 5, currentY + 3);

    // --- CAJA CENTRAL DERECHA: YNCA / IT ---
    currentY += 25; // Pequeño espacio para la siguiente sección de cajas
    doc.rect(boxX, currentY, boxWidth, 15).stroke();
    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("YNCA / Information Technology", boxX + 5, currentY + 3);

    // --- CAJA INFERIOR DERECHA: Revision Date ---
    currentY += 20;
    doc.rect(boxX, currentY, boxWidth, 15).stroke();
    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("Revision Date:", boxX + 5, currentY + 3);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("2016-OCT-07", boxX + 5, currentY + 18);

    // --- TÍTULO PRINCIPAL DEL FORMULARIO ---
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Assigning IT Assets to Associates Form", 50, 120);

    // --- 2. TEXTO LEGAL Y CONFIDENCIALIDAD (Alineación) ---

    // Título de la izquierda (FORM AA-IT-xx-F-002) - Lo simulas con texto
    doc.fontSize(8).font("Helvetica-Bold").text("FORM", 50, 138);
    doc.fontSize(8).font("Helvetica").text("AA-IT-xx-F-002", 80, 138);

    // Texto de Confidencialidad (Replicando la plantilla de la derecha)
    const confidentialText =
      "CONFIDENTIAL: This information is Yazaki property and can only be distributed to formal business partners or parties authorized by the signing of non-disclosure agreements. Copies are uncontrolled and subject to YA-01-01 Documentation and Records Policy.";
    doc.fontSize(7).font("Helvetica").text(confidentialText, 50, 150, {
      align: "justify",
      width: 500,
    });

    // Texto de Recepción de Equipo (Simulando la fuente del acta)
    const acknowledgedText =
      "I acknowledge the receipt of the following equipment from the Department of Information Technology for which I am responsible for. These responsibilities include but are not limited to following the guidelines listed in corporate policy AA-IT-xx-Y-017 IT Equipment and Network Access Policy. I also understand I must present this equipment for all physical inventory processes and software audits, assure computer will be on the network to receive service packs and virus updates a minimum of every 30 days, and to report the theft or loss of equipment to the IT Department. In the event you cannot produce physical verification of an asset (after two physical inventories) you are responsible to complete an asset disposal form.";

    doc.fontSize(9).font("Helvetica").text(acknowledgedText, 50, 185, {
      align: "justify",
      width: 500,
      lineGap: 2, // Añadir un poco de espacio entre líneas para que se parezca más al acta
    });

    // --- 3. DETALLES DEL EQUIPO (Usando posicionamiento para imitar las líneas) ---

    let detailY = doc.y + 15; // Empezamos a dibujar las líneas de detalle

    // Fila 1: Hardware Description (Título)
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Hardware Description:", 50, detailY);
    detailY += 15;

    // Fila 2: Equipo/Modelo
    doc.font("Helvetica-Bold").text("Equipo/Modelo:", 55, detailY);
    doc.font("Helvetica").text(assignmentData.modeloEquipo, 170, detailY);
    detailY += 15;

    // Fila 3: Serial Number
    doc.font("Helvetica-Bold").text("Serial number:", 55, detailY);
    doc.font("Helvetica").text(assignmentData.serie, 170, detailY);
    detailY += 15;

    // Fila 4: Accesorios
    doc.font("Helvetica-Bold").text("Accesorios:", 55, detailY);
    doc
      .font("Helvetica")
      .text(assignmentData.accesorios.join(", "), 170, detailY);
    detailY += 15;

    // Fila 5: Fixed Asset Tag Number
    doc.font("Helvetica-Bold").text("Fixed Asset Tag Number:", 55, detailY);
    doc.font("Helvetica").text(assignmentData.serie, 170, detailY);
    detailY += 25; // Espacio extra antes del nombre

    // Fila 6: Associates Printed Name (Línea de firma y nombre)
    doc.font("Helvetica-Bold").text("Associates Printed Name:", 55, detailY);
    doc.font("Helvetica").text(assignmentData.userInfo.nombre, 170, detailY);
    detailY += 15;

    // Fila 7: Location
    doc.font("Helvetica-Bold").text("Location:", 55, detailY);
    doc.font("Helvetica").text(assignmentData.localidad, 170, detailY);
    detailY += 15;

    // Fila 8: Date
    doc.font("Helvetica-Bold").text("Date:", 55, detailY);
    doc.font("Helvetica").text(fechaAsignacion, 170, detailY);

    // --- 4. PIE DE PÁGINA (Print Date) ---
    // Simular la fecha de impresión en la esquina inferior derecha
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("Print Date:", 400, doc.page.height - 50);
    doc.font("Helvetica").text(printDate, 450, doc.page.height - 50);

    doc.end();
  });
}
// --- FIN FUNCIÓN DE GENERACIÓN DE PDF ---

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ error: "Método no permitido. Solo se acepta GET." });
  }

  const { id } = req.query;

  if (!id) {
    return res
      .status(400)
      .json({ error: "Falta el ID del registro de asignación." });
  }

  try {
    // 1. OBTENER DATOS DEL REGISTRO DE ASIGNACIÓN
    const { data: asignacionData, error: dbError } = await supabase
      .from("asignaciones_permanentes")
      .select(`id, sapid, modelo, serie, detalles, fecha_asignacion, localidad`)
      .eq("id", id)
      .single();

    if (dbError || !asignacionData) {
      console.error(
        "Error al obtener datos de asignación para PDF:",
        dbError?.message
      );
      return res
        .status(404)
        .json({ error: "Registro de asignación no encontrado." });
    }

    // 2. CONSULTA SEPARADA: OBTENER DATOS COMPLETOS DEL USUARIO
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("nombre, descripcion, puesto")
      .eq("sapid", asignacionData.sapid)
      .single();

    if (userError || !userData) {
      console.error(
        "Error al obtener datos de usuario para PDF:",
        userError?.message
      );
      return res
        .status(404)
        .json({
          error:
            "No se pudo obtener la información completa del usuario para el acta.",
        });
    }

    // 3. MAPEO DE DATOS PARA EL PDF
    const pdfData = {
      ...asignacionData,
      asignacionId: asignacionData.id,
      modeloEquipo: asignacionData.modelo,
      accesorios: asignacionData.detalles || [],
      fecha_asignacion: asignacionData.fecha_asignacion,

      userInfo: {
        nombre: userData.nombre,
        puesto: userData.puesto,
        departamento: userData.descripcion,
      },
    };

    // 4. GENERAR EL PDF (Ahora generateAssignmentPdf está definido y usa pdfData correctamente)
    const pdfBuffer = await generateAssignmentPdf(pdfData);

    // 5. ENVIAR EL PDF AL CLIENTE
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Asignacion_${id}_${pdfData.userInfo.nombre.replace(
        /\s/g,
        "_"
      )}.pdf`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.end(pdfBuffer);
  } catch (error) {
    console.error("Error FATAL en la generación de PDF:", error.message);
    return res
      .status(500)
      .json({
        error:
          "Error inesperado al generar el PDF. Revise los logs del servidor.",
      });
  }
}
