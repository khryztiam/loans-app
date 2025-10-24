// El componente ahora acepta datos como prop (o los obtiene de un hook de contexto/estado)
export default function AssigningITAssetsForm({ assignmentData }) {
  // Desestructurar datos para facilitar el uso (Usaremos valores por defecto para que compile)
  const data = assignmentData || {
    nombre: "Nombre",
    modelo: "Equipo/Modelo",
    serie: "Número de Serie",
    detalles: "Accesorios",
    localidad: "Localidad",
    fecha_asignacion: "Fecha de Entrega",
  };

  // Formatear datos
  const accessoriesList = Array.isArray(data.detalles)
    ? data.detalles.join(", ")
    : data.detalles;
  const printDate = new Date().toLocaleDateString("es-ES");

  // Datos fijos de la plantilla
  const fixedRevisionDate = "2016-OCT-07";
  const formCode = "AA-IT-xx-F-002";

  // 🛑 ATENCIÓN: Esta es la tabla asimétrica que solicitaste
  return (
    <div className="form-container">
      <div className="header-form">
        <table className="header-table asimetrica">
          <tbody>
            {/* FILA 1 (Logo, Título Principal, Region/Dept.) */}
            <tr>
              {/* Columna Izquierda: Logo (rowSpan=2) */}
              <td className="col-logo" rowSpan={2} style={{ width: "20%" }}>
                <img
                  src="/yazaki-logo.jpg" // Asegúrate de que esta ruta sea correcta
                  alt="Yazaki Logo"
                  className="logo-img"
                />
              </td>

              {/* Columna Central: Título Principal (rowSpan=2) */}
              <td
                className="col-main-title"
                rowSpan={2}
                style={{ width: "60%" }}
              >
                YNCA Business Management Systems
              </td>

              {/* Columna Derecha: Region / Dept. */}
              <td className="col-right-label" style={{ width: "20%" }}>
                Region / Dept.
              </td>
            </tr>

            {/* FILA 2 (YNCA / Information Technology) */}
            <tr>
              {/* Columna Derecha: YNCA / IT */}
              <td className="col-right-value">YNCA / Information Technology</td>
            </tr>

            {/* FILA 3 (FORM, Título Sub, Revision Date Label) */}
            <tr>
              {/* Columna Izquierda: FORM label */}
              <td className="col-left-label">FORM</td>

              {/* Columna Central: Subtítulo (rowSpan=2) */}
              <td className="col-sub-title" rowSpan={2}>
                Assigning IT Assets to Associates Form
              </td>

              {/* Columna Derecha: Revision Date Label */}
              <td className="col-right-label"> Revision Date:</td>
            </tr>

            {/* FILA 4 (Código, Fecha de Revisión) */}
            <tr>
              {/* Columna Izquierda: Código AA-IT-xx-F-002 */}
              <td className="col-left-code">{formCode}</td>

              {/* Columna Derecha: Fecha de Revisión */}
              <td className="col-right-value">{fixedRevisionDate}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <section className="confidential">
        <p>
          <strong>CONFIDENTIAL:</strong> This information is Yazaki property and
          can only be distributed to formal business partners or parties
          authorized by the signing of non-disclosure agreements. Copies are
          uncontrolled and subject to YA-01-01 Documentation and Records Policy.
        </p>
      </section>

      <section className="acknowledgement">
        <p>
          I acknowledge the receipt of the following equipment from the
          Department of Information Technology for which I am responsible for.
          These responsibilities include but are not limited to following the
          guidelines listed in corporate policy{" "}
          <strong>AA-IT-xx-Y-017 IT Equipment and Network Access Policy</strong>
          . I also understand I must present this equipment for all physical
          inventory processes and software audits, assure computer will be on
          the network to receive service packs and virus updates a minimum of
          every 30 days, and to report the theft or loss of equipment to the IT
          Department. In the event you cannot produce physical verification of
          an asset (after two physical inventories) you are responsible to
          complete an asset disposal form.
        </p>
      </section>

      <section className="hardware">
        <h4>Hardware Description:</h4>
        <table className="hardware-table">
          <tbody>
            <tr>
              <td>Equipo/Modelo:</td>
              <td>
                <strong>{data.modelo}</strong>
              </td>
            </tr>
            <tr>
              <td>Laptop Serial number:</td>
              <td>
                <strong>{data.serie}</strong>
              </td>
            </tr>
            <tr>
              <td>Accesories:</td>
              <td>
                <strong>{accessoriesList}</strong>
              </td>
            </tr>
            <tr>
              <td>Fixed Asset Tag Number:</td>
              <td>
                <strong>WS-{data.serie}</strong>
              </td>
            </tr>
            <tr>
              <td>Associate Printed Name:</td>
              <td>
                <strong>{data.userInfo.nombre}</strong>
              </td>
            </tr>
            <tr>
              <td>Location:</td>
              <td>
                <strong>{data.localidad}</strong>
              </td>
            </tr>
            <tr>
              <td>Date:</td>
              <td>
                <strong>{data.fecha_asignacion}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="signatures">
         <div className="signatures-table">
            <div className="signature-line"></div>
            <div className="signature-label">Associate Signature</div>
         </div>
      </section>

      <footer className="footer">
        <div className="print-info">
          <strong>Print Date:</strong> {printDate}
        </div>
      </footer>
    </div>
  );
}
