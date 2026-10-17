import React, { forwardRef } from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, name, id, error, className = '', ...rest }, ref) => {
    const inputId = id || name;

    return (
      <div className="w-full flex flex-col space-y-1">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          name={name}
          className={`w-full p-3 rounded-lg border bg-white/70 dark:bg-black/40 backdrop-blur-md text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-700 focus:ring-primary focus:border-transparent'
          } ${className}`.trim()}
          {...rest}
        />
        {error && (
          <span className="text-xs text-red-500 font-medium">{error}</span>
        )}
      </div>
    );
  }
);

InputField.displayName = 'InputField';

export default InputField;