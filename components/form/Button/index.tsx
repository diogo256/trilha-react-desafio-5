import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export default function MyButton({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  ...rest
}: ButtonProps) {
  const baseStyles =
    'px-6 py-3 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98]';

  const variants = {
    primary:
      'bg-primary text-white hover:opacity-90 focus:ring-primary dark:focus:ring-offset-gray-900',
    secondary:
      'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60 focus:ring-gray-400',
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}