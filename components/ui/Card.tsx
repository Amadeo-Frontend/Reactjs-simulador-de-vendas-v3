import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

// FIX: The Card component was a standard functional component which cannot receive a ref.
// It has been wrapped in React.forwardRef to allow it to accept a ref and forward it
// to the underlying div element. This is necessary for the PDF export feature in MarginSimulator.tsx.
const Card = React.forwardRef<HTMLDivElement, CardProps>(({ children, className = '' }, ref) => {
    return (
        <div ref={ref} className={`bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 ${className}`}>
            {children}
        </div>
    );
});

Card.displayName = 'Card';

export default Card;
