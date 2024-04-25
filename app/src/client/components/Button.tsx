import { MouseEventHandler, ReactNode } from 'react';

interface ButtonProps {
  onClick: MouseEventHandler<HTMLButtonElement>;
  label?: string;
}

export default function Button({ onClick, label }: ButtonProps) {
  return (
    <button
      className='rounded-md px-3.5 py-2.5 text-sm  bg-airt-primary text-airt-font-base   hover:bg-opacity-85 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
      onClick={onClick}
    >
      {label}
    </button>
  );
}
