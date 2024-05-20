import React from 'react';

interface SelectInputProps {
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export const SelectInput: React.FC<SelectInputProps> = ({ id, value, options, onChange }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className='my-2 p-2 border rounded w-full' id={id}>
    {options.map((option) => (
      <option key={option} value={option}>
        {option}
      </option>
    ))}
  </select>
);
