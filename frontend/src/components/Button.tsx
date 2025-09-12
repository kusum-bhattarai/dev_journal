import * as React from 'react';
import { Button as ShadcnButton } from './ui/button';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <ShadcnButton
        variant="matrix" // We set our custom variant as the default
        className={`px-4 py-2 transition duration-300 ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </ShadcnButton>
    );
  }
);
Button.displayName = 'Button';

export default Button;