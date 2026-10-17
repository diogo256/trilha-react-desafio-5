import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface MaxHeightTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxRows?: number;
  minRows?: number;
  label?: string;
  error?: string;
}

const MaxHeightTextarea = forwardRef<HTMLTextAreaElement, MaxHeightTextareaProps>(
  (
    {
      maxRows = 6,
      minRows = 4,
      className = '',
      placeholder = 'Escreva o conteúdo (suporta Markdown e HTML)...',
      value,
      defaultValue,
      label,
      error,
      id,
      name,
      onChange,
      ...rest
    },
    ref
  ) => {
    const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
    const [internalValue, setInternalValue] = useState<string>(
      (value as string) || (defaultValue as string) || ''
    );
    const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined);

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Encaminha a ref interna para a ref do React Hook Form
    useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    const currentValue = value !== undefined ? (value as string) : internalValue;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value);
      }
      onChange?.(e);
    };

    const handleTabChange = (tab: 'write' | 'preview') => {
      if (tab === 'preview' && textareaRef.current) {
        setContainerHeight(textareaRef.current.offsetHeight);
      }
      setActiveTab(tab);
    };

    const defaultTextareaStyles = `w-full p-4 rounded-b-lg border bg-white/70 dark:bg-black/40 backdrop-blur-md text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 resize-none ${
      error
        ? 'border-red-500 focus:ring-red-500'
        : 'border-gray-300 dark:border-gray-700 focus:ring-primary focus:border-transparent'
    }`;

    const textareaId = id || name;

    return (
      <div className={`w-full flex flex-col space-y-1 ${className}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}

        <div className="flex flex-col">
          <div className="flex items-center space-x-1 border-b border-gray-300 dark:border-gray-700 bg-gray-100/60 dark:bg-gray-800/60 rounded-t-lg px-2 pt-2">
            <button
              type="button"
              onClick={() => handleTabChange('write')}
              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                activeTab === 'write'
                  ? 'bg-white/80 dark:bg-gray-900 text-primary border-t-2 border-primary shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Escrever
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('preview')}
              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                activeTab === 'preview'
                  ? 'bg-white/80 dark:bg-gray-900 text-primary border-t-2 border-primary shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Visualizar (Preview)
            </button>
          </div>

          <div className={activeTab === 'write' ? 'block' : 'hidden'}>
            <TextareaAutosize
              id={textareaId}
              name={name}
              ref={textareaRef}
              maxRows={maxRows}
              minRows={minRows}
              placeholder={placeholder}
              value={value !== undefined ? value : internalValue}
              onChange={handleChange}
              className={defaultTextareaStyles}
              {...rest}
            />
          </div>

          {activeTab === 'preview' && (
            <div
              style={{ height: containerHeight ? `${containerHeight}px` : undefined }}
              className="w-full min-h-[140px] overflow-y-auto p-4 rounded-b-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-black/40 backdrop-blur-md prose dark:prose-dark max-w-none"
            >
              {currentValue.trim() ? (
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                  {currentValue}
                </ReactMarkdown>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 italic text-sm">
                  Nada para visualizar. Escreva algo na aba &quot;Escrever&quot;.
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <span className="text-xs text-red-500 font-medium">{error}</span>
        )}
      </div>
    );
  }
);

MaxHeightTextarea.displayName = 'MaxHeightTextarea';

export default MaxHeightTextarea;