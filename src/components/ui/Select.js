'use client';

function Select({
  label,
  options = [],
  error,
  touched,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className="mb-4">
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={`input ${error && touched ? 'input-error' : ''} ${className}`}
        {...props}
      >
        <option value="">Seleccionar...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && touched && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

export default Select;
