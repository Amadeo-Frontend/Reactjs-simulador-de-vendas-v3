import React, { forwardRef, InputHTMLAttributes } from 'react';
import clsx from 'clsx';

type Props = {
  label?: string;
  id?: string;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, id, className, type = 'text', onWheel, ...rest }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label ? (
          <label
            htmlFor={id}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        ) : null}

        <input
          ref={ref}
          id={id}
          type={type}
          // evita que o scroll do mouse altere o número sem querer
          onWheel={(e) => {
            if (type === 'number') (e.target as HTMLInputElement).blur();
            onWheel?.(e);
          }}
          className={clsx(
            'block w-full rounded-md border shadow-sm px-3 py-2 text-sm',
            // light
            'bg-white text-slate-900 placeholder-slate-400 border-slate-300',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            // dark
            'dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-600',
            'dark:focus:ring-blue-400 dark:focus:border-blue-400',
            className
          )}
          {...rest}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
