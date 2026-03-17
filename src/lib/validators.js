// Validaciones comunes
export const validators = {
  sapid: (value) => /^\d{8}$/.test(value),
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  serie: (value) => value && value.length > 0,
  loanDays: (value) => /^\d+$/.test(value) && parseInt(value) > 0,
};

export const validateForm = (formData, schema) => {
  const errors = {};
  for (const [key, validator] of Object.entries(schema)) {
    if (!validator(formData[key])) {
      errors[key] = `Campo ${key} inválido`;
    }
  }
  return errors;
};
