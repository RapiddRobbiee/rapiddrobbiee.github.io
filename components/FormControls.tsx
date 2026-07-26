import React from 'react';

interface BaseProps {
  label: string;
  helpText?: string;
  className?: string;
}

interface FormInputProps extends BaseProps {
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  // Fix: Add onBlur to FormInputProps
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
  helpText,
  className,
  min,
  max,
  onBlur,
}) => (
  <div className={`flex flex-col ${className}`}>
    <label className="block text-sm font-medium text-[var(--clr-text-muted)] mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
      className={`w-full bg-[var(--clr-bg-main)]/50 text-[var(--clr-text)] rounded-md px-3 py-2 focus:outline-none transition placeholder-[var(--clr-text-muted)]/50 border border-[var(--clr-border)] focus:border-[var(--clr-primary)] ${disabled ? 'opacity-50 cursor-not-allowed' : ''} font-roboto-mono`}
    />
    {helpText && <p className="mt-1 text-xs text-[var(--clr-text-muted)] opacity-80">{helpText}</p>}
  </div>
);

interface FormSelectProps extends BaseProps {
  value: string | number;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string | number }>;
  disabled?: boolean;
  allowCustom?: boolean;
  customLabel?: string;
  isOptional?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  value,
  onChange,
  options,
  disabled,
  helpText,
  className,
  allowCustom,
  customLabel,
  isOptional,
}) => (
  <div className={`flex flex-col ${className}`}>
    <label className="block text-sm font-medium text-[var(--clr-text-muted)] mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full bg-[var(--clr-bg-main)]/50 text-[var(--clr-text)] rounded-md px-3 py-2.5 focus:outline-none transition border border-[var(--clr-border)] focus:border-[var(--clr-primary)] ${disabled ? 'opacity-50 cursor-not-allowed' : ''} font-roboto-mono`}
    >
      {isOptional && (
        <option value="" className="bg-[var(--clr-bg-card)] text-[var(--clr-text-muted)]">
          -- None --
        </option>
      )}
      {options.map((opt) => (
        <option
          key={opt.value}
          value={opt.value}
          className="bg-[var(--clr-bg-card)] text-[var(--clr-text)]"
        >
          {opt.label}
        </option>
      ))}
      {allowCustom && (
        <option value="custom_id" className="bg-[var(--clr-bg-card)] text-[var(--clr-warning)]">
          {customLabel || 'Enter Custom ID...'}
        </option>
      )}
    </select>
    {helpText && <p className="mt-1 text-xs text-[var(--clr-text-muted)] opacity-80">{helpText}</p>}
  </div>
);

interface FormTextAreaProps extends BaseProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
}

export const FormTextArea: React.FC<FormTextAreaProps> = ({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
  disabled,
  helpText,
  className,
}) => (
  <div className={`flex flex-col ${className}`}>
    <label className="block text-sm font-medium text-[var(--clr-text-muted)] mb-1">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full bg-[var(--clr-bg-main)]/50 text-[var(--clr-text)] rounded-md px-3 py-2 focus:outline-none transition placeholder-[var(--clr-text-muted)]/50 border border-[var(--clr-border)] focus:border-[var(--clr-primary)] ${disabled ? 'opacity-50 cursor-not-allowed' : ''} font-roboto-mono`}
    />
    {helpText && <p className="mt-1 text-xs text-[var(--clr-text-muted)] opacity-80">{helpText}</p>}
  </div>
);

interface FormCheckboxProps extends BaseProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  label,
  checked,
  onChange,
  disabled,
  helpText,
  className,
}) => (
  <div className={`flex items-center ${className}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className={`h-4 w-4 text-[var(--clr-primary)] border-[var(--clr-border)] rounded bg-[var(--clr-bg-main)]/50 focus:ring-[var(--clr-primary)] focus:ring-offset-[var(--clr-bg-card)] transition ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    />
    <label className="ml-2 block text-sm text-[var(--clr-text-muted)]">{label}</label>
    {helpText && <p className="ml-2 text-xs text-[var(--clr-text-muted)] opacity-80">{helpText}</p>}
  </div>
);
