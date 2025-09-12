import * as React from 'react';
import { Textarea as ShadcnTextarea } from './ui/textarea';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Input = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <ShadcnTextarea
        className={`bg-matrix-black text-matrix-green border-none outline-none p-2 resize-none rounded ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export default Input;