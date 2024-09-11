import React from 'react';

interface TextAreaProps {
  id: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  isDisabled?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({ id, value, placeholder, onChange, isDisabled }) => (
  <textarea
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    className='my-2 p-2 border rounded w-full h-40'
    id={id}
    disabled={isDisabled}
  />
);
