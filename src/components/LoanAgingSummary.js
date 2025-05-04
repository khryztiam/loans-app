// components/LoanAgingSummary.js
import { Card, CardContent, Typography, Box } from '@mui/material';
import { differenceInDays, parseISO } from 'date-fns';

const ranges = [
  { label: '+90 días', min: 90, max: Infinity, color: '#8B0000' },
  { label: '+60 días', min: 60, max: 89, color: '#FF0000' },
  { label: '+30 días', min: 30, max: 59, color: '#FF8C00' },
  { label: '+15 días', min: 15, max: 29, color: '#FFA500' },
  { label: '+7 días', min: 7, max: 14, color: '#FFD700' },
  { label: '+3 días', min: 3, max: 6, color: '#77c2d7' },
  { label: '<3 días', min: 0, max: 2, color: '#90EE90' } // Opcional: para préstamos recientes
];

function calculateAging(loans) {
  const now = new Date();
  return ranges.map(range => {
    const count = loans.filter(loan => {
      const days = differenceInDays(now, parseISO(loan.created_at));
      return days >= range.min && days <= range.max;
    }).length;
    return { ...range, count };
  });
}

export default function LoanAgingSummary({ loans = [] }) {
  const agingData = calculateAging(loans);

  return (
    <div className="aging-summary-grid">
      {agingData.map((range) => (
        <div className="aging-card" key={range.label}>
          <Card
            sx={{
              backgroundColor: range.color,
              color: 'white',
              height: '100%',
              width: '100%',
            }}
          >
            <CardContent>
              <Typography variant="subtitle1"><strong>{range.label}</strong></Typography>
              <Typography variant="body1">
                {range.count} equipos
              </Typography>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}