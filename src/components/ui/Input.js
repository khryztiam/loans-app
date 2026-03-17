'use client';

function Input({
  label,
  error,
  touched,
  type = 'text',
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
      <input
        type={type}
        className={`input ${error && touched ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && touched && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

export default Input;
