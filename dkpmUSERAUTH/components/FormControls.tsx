
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
}

export const FormInput: React.FC<FormInputProps> = ({ label, value, onChange, type = 'text', placeholder, disabled, helpText, className, min, max }) => (
  <div className={`mb-1 ${className}`}>
    <label className="block text-sm font-medium text-orange-300 mb-1 font-rajdhani">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
      className={`w-full bg-indigo-700 bg-opacity-50 border border-indigo-500 text-indigo-100 rounded-md shadow-sm py-2 px-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-150 ease-in-out placeholder-indigo-400 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    />
    {helpText && <p className="mt-1 text-xs text-indigo-300 opacity-80">{helpText}</p>}
  </div>
);

interface FormSelectProps extends BaseProps {
  value: string | number;
  onChange: (value: string) => void;
  options: Array<{ label: string, value: string | number }>;
  disabled?: boolean;
  allowCustom?: boolean;
  customLabel?: string;
  isOptional?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({ label, value, onChange, options, disabled, helpText, className, allowCustom, customLabel, isOptional }) => (
  <div className={`mb-1 ${className}`}>
    <label className="block text-sm font-medium text-orange-300 mb-1 font-rajdhani">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full bg-indigo-700 bg-opacity-50 border border-indigo-500 text-indigo-100 rounded-md shadow-sm py-2 px-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-150 ease-in-out ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {isOptional && <option value="">-- None --</option>}
      {options.map(opt => <option key={opt.value} value={opt.value} className="bg-indigo-700 text-indigo-100">{opt.label}</option>)}
      {allowCustom && <option value="custom_id" className="bg-indigo-700 text-indigo-100">{customLabel || 'Enter Custom ID...'}</option>}
    </select>
    {helpText && <p className="mt-1 text-xs text-indigo-300 opacity-80">{helpText}</p>}
  </div>
);

interface FormTextAreaProps extends BaseProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
}

export const FormTextArea: React.FC<FormTextAreaProps> = ({ label, value, onChange, rows = 3, placeholder, disabled, helpText, className }) => (
  <div className={`mb-1 ${className}`}>
    <label className="block text-sm font-medium text-orange-300 mb-1 font-rajdhani">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full bg-indigo-700 bg-opacity-50 border border-indigo-500 text-indigo-100 rounded-md shadow-sm py-2 px-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-150 ease-in-out placeholder-indigo-400 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    />
    {helpText && <p className="mt-1 text-xs text-indigo-300 opacity-80">{helpText}</p>}
  </div>
);

interface FormCheckboxProps extends BaseProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({ label, checked, onChange, disabled, helpText, className }) => (
  <div className={`mb-1 flex items-center ${className}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className={`h-4 w-4 text-orange-500 border-indigo-500 rounded bg-indigo-700 bg-opacity-50 focus:ring-orange-400 focus:ring-offset-indigo-800 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    />
    <label className="ml-2 block text-sm text-indigo-100 font-rajdhani">{label}</label>
    {helpText && <p className="ml-2 text-xs text-indigo-300 opacity-80">{helpText}</p>}
  </div>
);