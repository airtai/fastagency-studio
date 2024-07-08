import React from 'react';

interface MissingDependency {
  property_type: string;
  model_type: string;
  label: string;
}

interface SelectInputProps {
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  missingDependencies: MissingDependency[];
  onMissingDependencyClick: (e: any, type: string) => void;
}

export const SelectInput: React.FC<SelectInputProps> = ({
  id,
  value,
  options,
  onChange,
  missingDependencies,
  onMissingDependencyClick,
}) => {
  return (
    <div className=''>
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
      <div>
        {missingDependencies &&
          missingDependencies.length > 0 &&
          // render button for each item in missingDependencies
          missingDependencies.map((missingDependency, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault();
                if (missingDependency) {
                  onMissingDependencyClick(e, missingDependency.property_type);
                }
              }}
              className='rounded-md mr-2 my-2 px-3.5 py-2.5 text-sm bg-airt-primary text-airt-font-base hover:bg-opacity-85 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 whitespace-nowrap'
            >
              {`Add '${missingDependency.model_type}' as ${missingDependency.label}`}
            </button>
          ))}
      </div>
    </div>
  );
};
