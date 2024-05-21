import React, { useState } from 'react';

interface formElementObjectValues {
  default?: string;
  description?: string;
  enum?: string[];
  title?: string;
  type?: string;
}

interface NumericStepperWithClearButtonProps {
  id: string;
  formElementObject?: formElementObjectValues;
  value: number; // Pass the current value as a prop
  onChange: (value: number | null) => void; // Prop to handle value changes
}

export const NumericStepperWithClearButton: React.FC<NumericStepperWithClearButtonProps> = ({
  id,
  formElementObject,
  value,
  onChange,
}) => {
  const [inputValue, setInputValue] = useState<number | null>(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetValue = e.target.value;
    const newValue = targetValue === '' ? null : parseInt(e.target.value, 10);
    setInputValue(newValue);
    onChange(newValue); // Call parent onChange with new value
  };

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setInputValue(null); // Clear the local input
    onChange(null); // Pass the empty string to parent onChange
  };

  return (
    <div className='flex gap-4'>
      <input
        className='my-2 p-2 border rounded w-full'
        type='number'
        data-testid='numeric-stepper'
        id={id}
        placeholder={`${formElementObject?.description}. Enter a number or 'Clear' to use the default value 'None'.`}
        value={inputValue ? inputValue : ''}
        onChange={handleChange}
        min='1'
      />
      <button
        onClick={handleClear}
        className='rounded-md my-2 px-3.5 py-2.5 text-sm bg-airt-primary text-airt-font-base hover:bg-opacity-85 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
      >
        Clear
      </button>
    </div>
  );
};
