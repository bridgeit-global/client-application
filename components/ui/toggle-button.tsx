'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Smaller Tick Icon for compact button
const TickIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-4 w-4 text-black"
  >
    <path
      fillRule="evenodd"
      d="M10.293 16.293a1 1 0 0 0 1.414 0l7-7a1 1 0 0 0-1.414-1.414L11 13.586 7.707 10.293a1 1 0 0 0-1.414 1.414l3.5 3.5z"
      clipRule="evenodd"
    />
  </svg>
);

const ToggleButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex h-[30px] w-[60px] items-center justify-center rounded-md shadow-sm transition-transform duration-200',
      'bg-[rgb(250,204,21)] hover:scale-105 active:scale-95', // Yellow background with hover and active effects
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      className
    )}
    {...props}
  >
    <TickIcon />
  </button>
));
ToggleButton.displayName = 'ToggleButton';

export { ToggleButton };
