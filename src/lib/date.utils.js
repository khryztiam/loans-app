import { formatDistanceToNow, isAfter, addDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const dateUtils = {
  formatCustom: (date, format = 'dd/MM/yyyy') => {
    return new Intl.DateTimeFormat('es-ES').format(new Date(date));
  },
  
  getDaysDifference: (startDate) => {
    const now = new Date();
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const diffTime = now - start;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  },

  isExpired: (createdAt, loanDays) => {
    const deadline = addDays(parseISO(createdAt), loanDays);
    return isAfter(new Date(), deadline);
  },

  getExpirationStatus: (createdAt, loanDays) => {
    const deadline = addDays(parseISO(createdAt), loanDays);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', days: Math.abs(daysUntilExpiry) };
    if (daysUntilExpiry === 0) return { status: 'today', days: 0 };
    if (daysUntilExpiry <= 3) return { status: 'warning', days: daysUntilExpiry };
    return { status: 'ok', days: daysUntilExpiry };
  },
};
