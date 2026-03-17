// Estados de préstamo
export const LOAN_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  RECEIVED: 'received',
  WARNING: 'warning',
};

// Tipos de equipo
export const EQUIPMENT_TYPES = [
  { value: 'Laptop', label: 'Laptop' },
  { value: 'Tablet', label: 'Tablet' },
  { value: 'Escáner', label: 'Escáner' },
  { value: 'Impresora', label: 'Impresora' },
  { value: 'Extensión', label: 'Extensión (Cable, HUB, etc.)' },
  { value: 'UPS', label: 'UPS / Batería' },
];

// Modelos de laptop (Cargar de BD en el futuro)
export const LAPTOP_MODELS = [
  'LATITUDE 5420',
  'LATITUDE 5430',
  'LATITUDE 5440',
  'LATITUDE 5450',
  'LATITUDE 5480',
  'LATITUDE 5490',
  'OPTIPLEX 3000',
  'OPTIPLEX 7010',
  'OPTIPLEX 7020',
];

// Accesorios disponibles
export const ACCESSORIES = [
  'MOUSE WIRELESS',
  'KEYBOARD WIRELESS',
  'CARGADOR',
  'MOCHILA',
  'MOUSE',
  'TECLADO',
  'COVER',
  'STYLUS',
];

// Localidades
export const LOCATIONS = [
  'Santa Ana',
  'Rinconcito',
  'Intercomplex',
];

// Paginación
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
};

// Mensajes de error
export const ERROR_MESSAGES = {
  INVALID_LOGIN: 'Email o contraseña incorrectos',
  EMAIL_NOT_CONFIRMED: 'Confirme su email antes de acceder',
  USER_NOT_FOUND: 'Usuario no encontrado',
  INVALID_SAPID: 'SAP ID debe ser 8 dígitos',
  NETWORK_ERROR: 'Error de conexión. Intente nuevamente',
  GENERIC_ERROR: 'Ocurrió un error. Intente nuevamente',
};
