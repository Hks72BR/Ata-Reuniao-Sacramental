import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  helperText?: string;
  maxLength?: number;
  currentLength?: number;
}

interface InputFieldProps extends FormFieldProps, InputHTMLAttributes<HTMLInputElement> {}

interface TextAreaFieldProps extends FormFieldProps, TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, required, helperText, maxLength, currentLength, className, ...props }, ref) => {
    return (
      <div className="form-field">
        <label className="form-field-label">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        <input
          ref={ref}
          maxLength={maxLength}
          className={`${error ? 'border-destructive' : ''} ${className || ''}`}
          {...props}
        />
        {error && <p className="text-destructive text-sm mt-1">{error}</p>}
        {helperText && <p className="text-muted-foreground text-sm mt-1">{helperText}</p>}
        {maxLength && (
          <p className="text-muted-foreground text-xs mt-1">
            {currentLength || 0} / {maxLength}
          </p>
        )}
      </div>
    );
  }
);

InputField.displayName = 'InputField';

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, required, helperText, maxLength, currentLength, className, ...props }, ref) => {
    return (
      <div className="form-field">
        <label className="form-field-label">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        <textarea
          ref={ref}
          maxLength={maxLength}
          className={`resize-none min-h-[120px] ${error ? 'border-destructive' : ''} ${className || ''}`}
          {...props}
        />
        {error && <p className="text-destructive text-sm mt-1">{error}</p>}
        {helperText && <p className="text-muted-foreground text-sm mt-1">{helperText}</p>}
        {maxLength && (
          <p className="text-muted-foreground text-xs mt-1">
            {currentLength || 0} / {maxLength}
          </p>
        )}
      </div>
    );
  }
);

TextAreaField.displayName = 'TextAreaField';
