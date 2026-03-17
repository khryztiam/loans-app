// Utilidades generales
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export const downloadFile = (data, filename, type = 'application/json') => {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const truncate = (str, length = 50) => {
  return str.length > length ? str.substring(0, length) + '...' : str;
};
