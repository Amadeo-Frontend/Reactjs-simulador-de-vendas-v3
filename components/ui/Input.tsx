import React, { forwardRef, InputHTMLAttributes } from 'react';
import clsx from 'clsx';

type Props = {
  label?: string;
  id?: string;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, id, className, type = 'text', ...rest }, ref) => {
    const isNumber = type === 'number';

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
          className={clsx(
            // base: mais contraste e foco visível
            'block w-full rounded-md border shadow-sm',
            'bg-white text-slate-900 placeholder-slate-400 border-slate-300',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            // dark mode
            'dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-600',
            'dark:focus:ring-blue-400 dark:focus:border-blue-400',
            // tipografia/espaçamento
            'px-3 py-2 text-sm',
            // number: remove spinners e padroniza
            isNumber &&
              '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
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
