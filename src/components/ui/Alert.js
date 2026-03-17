'use client';

function Alert({ children, variant = 'info', className = '' }) {
  const variants = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info',
  };

  return <div className={`alert ${variants[variant]} ${className}`}>{children}</div>;
}

export default Alert;
