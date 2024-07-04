import React from 'react';
import { useHistory } from 'react-router-dom';

interface SelectInputProps {
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  missingDependency: { type: string | null; label: string } | null;
}

export const SelectInput: React.FC<SelectInputProps> = ({ id, value, options, onChange, missingDependency }) => {
  const history = useHistory();
  return (
    <div className='flex gap-4'>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='my-2 p-2 border rounded w-full'
        id={id}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {missingDependency && missingDependency.type && (
        <button
          onClick={(e) => {
            e.preventDefault();
            if (missingDependency) {
              history.push(`/build/${missingDependency.type}`);
            }
          }}
          className='rounded-md my-2 px-3.5 py-2.5 text-sm bg-airt-primary text-airt-font-base hover:bg-opacity-85 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 whitespace-nowrap'
        >
          {`Add ${missingDependency.label}`}
        </button>
      )}
    </div>
  );
};
