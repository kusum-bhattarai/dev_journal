import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const Button = ({ onClick, children, className = '' }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`bg-matrix-green text-matrix-black px-4 py-2 rounded hover:bg-green-500 transition duration-300 ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;