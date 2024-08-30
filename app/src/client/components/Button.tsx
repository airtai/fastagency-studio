import { MouseEventHandler, ReactNode } from 'react';

import { PlusCircle } from 'lucide-react';

interface ButtonProps {
  onClick: MouseEventHandler<HTMLButtonElement>;
  label?: string;
  theme?: 'light' | 'dark';
}

export default function Button({ onClick, label, theme = 'dark' }: ButtonProps) {
  const buttonBG = theme === 'dark' ? 'bg-airt-secondary' : 'bg-airt-primary';
  const buttonTextColor = theme === 'dark' ? 'text-airt-dark-blue' : 'bg-airt-primary';
  return (
    <button
      className={`relative inline-flex items-center justify-center rounded-full hover:opacity-80 px-6 py-3 text-xs font-bold ${buttonBG} ${buttonTextColor} transition-all duration-200 ease-in-out`}
      style={{
        boxShadow: '5px 5px 0px 0px #0080FF',
      }}
      onClick={onClick}
    >
      <PlusCircle className='mr-2 font-bold' size={16} />
      <span>{label?.toUpperCase()}</span>
    </button>
  );
}
