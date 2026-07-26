import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

interface SearchableSelectProps {
  label: string;
  options: Array<{ label: string; value: string | number }>;
  value: string | number | null;
  onChange: (value: string | number) => void;
  helpText?: string;
  className?: string;
  disabled?: boolean;
  isOptional?: boolean;
  optionalLabel?: string;
  placeholder?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  options,
  value,
  onChange,
  helpText,
  className,
  disabled,
  isOptional,
  optionalLabel = '-- None --',
  placeholder = 'Select an option...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const allOptions = useMemo(() => {
    return isOptional ? [{ label: optionalLabel, value: '' }, ...options] : options;
  }, [options, isOptional, optionalLabel]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) {
      return allOptions;
    }
    return allOptions.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allOptions, searchTerm]);

  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const itemElement = listRef.current.children[highlightedIndex] as HTMLLIElement;
      if (itemElement) {
        itemElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelectOption(filteredOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const selectedLabel = useMemo(() => {
    const selected = allOptions.find((o) => o.value === value);
    return selected ? selected.label : placeholder;
  }, [allOptions, value, placeholder]);

  const handleSelectOption = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div
      className={`flex flex-col relative ${className}`}
      ref={wrapperRef}
      onKeyDown={handleKeyDown}
    >
      <label className="block text-sm font-medium text-[var(--clr-text-muted)] mb-1">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-[var(--clr-bg-main)]/50 border-b-2 border-[var(--clr-border)] text-[var(--clr-text)] rounded-t-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--clr-border-focus)] focus:bg-[var(--clr-bg-main)]/70 transition duration-200 ease-in-out text-left flex justify-between items-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''} font-roboto-mono`}
      >
        <span className="truncate">{selectedLabel}</span>
        <i
          className={`fas fa-chevron-down text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}
        ></i>
      </button>
      {helpText && (
        <p className="mt-1 text-xs text-[var(--clr-text-muted)] opacity-80">{helpText}</p>
      )}

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 w-full max-h-60 bg-[var(--clr-bg-main)] border border-[var(--clr-border-focus)] rounded-md shadow-xl z-50 flex flex-col">
          <div className="p-2 border-b border-[var(--clr-border)]">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--clr-bg-main)]/50 border-b-2 border-[var(--clr-border)] text-[var(--clr-text)] rounded-t-md px-2 py-1.5 focus:outline-none focus:border-[var(--clr-border-focus)] font-roboto-mono text-sm"
            />
          </div>
          <ul ref={listRef} className="overflow-y-auto flex-grow custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <li
                  key={String(option.value)}
                  onClick={() => handleSelectOption(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3 py-2 cursor-pointer text-sm font-roboto-mono truncate ${highlightedIndex === index ? 'bg-[var(--clr-primary)] text-[var(--clr-text-on-primary)]' : 'hover:bg-[var(--clr-bg-main)]/80'}`}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-[var(--clr-text-muted)] italic">
                No options found.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
