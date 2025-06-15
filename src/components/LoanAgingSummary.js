// components/LoanAgingSummary.js
import { differenceInDays, parseISO } from "date-fns";

const ranges = [
  { label: "90+ días", min: 90, color: "#8B0000" },
  { label: "60-89 días", min: 60, max: 89, color: "#FF0000" },
  { label: "30-59 días", min: 30, max: 59, color: "#FF8C00" },
  { label: "15-29 días", min: 15, max: 29, color: "#FFA500" },
  { label: "7-14 días", min: 7, max: 14, color: "#FFD700" },
  { label: "3-6 días", min: 3, max: 6, color: "#77c2d7" },
  { label: "0-2 días", min: 0, max: 2, color: "#90EE90" },
];

function calculateAging(loans) {
  const now = new Date();

  // Filtrar solo equipos prestados (no recibidos)
  const activeLoans = loans.filter(
    (loan) => loan.sapid_recepcion === null && loan.received_at === null
  );

  // Calcular días para cada préstamo activo
  const loansWithDays = activeLoans.map((loan) => ({
    ...loan,
    days: differenceInDays(now, parseISO(loan.created_at)),
  }));

  // Asignar cada préstamo a un solo rango (de mayor a menor)
  const rangeCounts = ranges.map(() => 0);

  loansWithDays.forEach((loan) => {
    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      const inRange = range.max
        ? loan.days >= range.min && loan.days <= range.max
        : loan.days >= range.min;

      if (inRange) {
        rangeCounts[i]++;
        break; // Asignar solo al primer rango que coincida
      }
    }
  });

  return ranges.map((range, i) => ({ ...range, count: rangeCounts[i] }));
}

export default function LoanAgingSummary({ loans = [] }) {
  const agingData = calculateAging(loans);
  const totalPrestados = loans.filter(
    (l) => l.sapid_recepcion === null && l.received_at === null
  ).length;

  return (
    <div className="aging-summary-grid">
      {agingData.map((range) => (
        <div
          className="aging-card"
          key={range.label}
          style={{ backgroundColor: range.color }}
        >
          <div className="aging-label">{range.label}</div>
          <div className="aging-count">{range.count} equipos</div>
        </div>
      ))}
      <div className="aging-total">Total equipos: {totalPrestados}</div>
    </div>
  );
}
