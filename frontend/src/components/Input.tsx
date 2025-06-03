import React from 'react';

interface InputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
}

const Input = ({ value, onChange, placeholder = '', className = '' }: InputProps) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full h-12 bg-matrix-black text-matrix-green border-none outline-none p-2 resize-none rounded ${className}`}
    />
  );
};

export default Input;