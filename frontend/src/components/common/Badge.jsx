import React from 'react';

export default function Badge({ children, variant = 'primary', icon: Icon }) {
  return (
    <span className={`badge badge-${variant}`}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
