import * as React from 'react';
import { Button as ShadcnButton, buttonVariants } from './ui/button';
import { VariantProps } from 'class-variance-authority';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant, ...props }, ref) => {
    return (
      <ShadcnButton
        // 'matrix' as the default variant, but can be overridden
        variant={variant || 'matrix'}
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