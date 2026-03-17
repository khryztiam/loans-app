'use client';

function Spinner({ size = 'md' }) {
  const sizes = {
    sm: 'spinner',
    md: 'spinner spinner-lg',
    lg: 'spinner-lg h-12 w-12',
  };

  return <div className={sizes[size]} />;
}

export default Spinner;
