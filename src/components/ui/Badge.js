'use client';

function Badge({ children, variant = 'info', className = '' }) {
  const variants = {
    success: 'badge-success',
    error: 'badge-error',
    warning: 'badge-warning',
    info: 'badge-info',
  };

  return <span className={`badge ${variants[variant]} ${className}`}>{children}</span>;
}

export default Badge;
