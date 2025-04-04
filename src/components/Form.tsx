import { FormEvent, ReactNode, useState } from 'react';
import { Input } from './Input';
import { Button } from './Button';

export type Field = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    message?: string;
  };
};

type FormProps = {
  title: string;
  fields: Field[];
  onSubmit: (e: FormEvent) => Promise<void>;
  onCancel: () => void;
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
  isLoading?: boolean;
  submitText?: string;
  children?: ReactNode;
};

export function Form({
  title,
  fields,
  onSubmit,
  onCancel,
  onChange,
  errors: externalErrors = {},
  isLoading = false,
  submitText = 'Submit',
  children
}: FormProps) {
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateField = (field: Field, value: string): string => {
    if (field.required && !value.trim()) {
      return `${field.label} is required`;
    }

    if (field.validation?.pattern && !field.validation.pattern.test(value)) {
      return field.validation.message || `Invalid ${field.label.toLowerCase()}`;
    }

    if (field.validation?.minLength && value.length < field.validation.minLength) {
      return `${field.label} must be at least ${field.validation.minLength} characters long`;
    }

    return '';
  };

  const handleFieldBlur = (field: Field, value: string) => {
    const error = validateField(field, value.trim());
    if (error) {
      setFormErrors(prev => ({ ...prev, [field.name]: error }));
    } else {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field.name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      const error = validateField(field, field.value);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    await onSubmit(e);
  };

  // Combine internal form validation errors with external errors (e.g., API errors)
  const allErrors = { ...formErrors, ...externalErrors };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {fields.map((field) => (
            <Input
              key={field.name}
              label={field.label}
              type={field.type || 'text'}
              required={field.required}
              value={field.value}
              onChange={(e) => {
                onChange(field.name, e.target.value);
                // Clear error when user starts typing
                if (allErrors[field.name]) {
                  setFormErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[field.name];
                    return newErrors;
                  });
                }
              }}
              onBlur={(e) => handleFieldBlur(field, e.target.value)}
              error={allErrors[field.name]}
            />
          ))}
          {children}
          <div className="flex justify-end space-x-4">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || Object.keys(allErrors).length > 0}
            >
              {submitText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}