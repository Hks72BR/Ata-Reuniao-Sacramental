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
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
        <input
          ref={ref}
          maxLength={maxLength}
          className={`bg-white text-[#1e3a5f] ${error ? 'border-red-500' : 'border-[#1e3a5f]/20'} ${className || ''}`}
          {...props}
        />
        {error && <p className="text-red-600 text-sm mt-1 font-medium">{error}</p>}
        {helperText && <p className="text-gray-600 text-sm mt-1">{helperText}</p>}
        {maxLength && (
          <p className="text-gray-500 text-xs mt-1">
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
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
        <textarea
          ref={ref}
          maxLength={maxLength}
          className={`resize-none min-h-[120px] bg-white text-[#1e3a5f] ${error ? 'border-red-500' : 'border-[#1e3a5f]/20'} ${className || ''}`}
          {...props}
        />
        {error && <p className="text-red-600 text-sm mt-1 font-medium">{error}</p>}
        {helperText && <p className="text-gray-600 text-sm mt-1">{helperText}</p>}
        {maxLength && (
          <p className="text-gray-500 text-xs mt-1">
            {currentLength || 0} / {maxLength}
          </p>
        )}
      </div>
    );
  }
);

TextAreaField.displayName = 'TextAreaField';
