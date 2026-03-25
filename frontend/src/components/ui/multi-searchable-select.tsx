import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  sublabel?: string;
}

interface MultiSearchableSelectProps {
  options: Option[];
  value: string; // Comma-separated values
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiSearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Rechercher...',
  disabled = false,
  className,
}: MultiSearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse selected values from comma-separated string
  const selectedValues = value ? value.split(',').map(v => v.trim()).filter(Boolean) : [];

  // Get selected options
  const selectedOptions = options.filter(opt => selectedValues.includes(opt.value));

  // Filter options based on search
  const filteredOptions = options.filter((opt) => {
    const searchLower = search.toLowerCase();
    return (
      opt.value.toLowerCase().includes(searchLower) ||
      opt.label.toLowerCase().includes(searchLower) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(searchLower))
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = (optionValue: string) => {
    let newValues: string[];
    if (selectedValues.includes(optionValue)) {
      // Remove
      newValues = selectedValues.filter(v => v !== optionValue);
    } else {
      // Add
      newValues = [...selectedValues, optionValue];
    }
    onChange(newValues.join(', '));
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValues = selectedValues.filter(v => v !== optionValue);
    onChange(newValues.join(', '));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full min-h-[42px] flex items-center justify-between px-3 py-2 text-sm text-left',
          'border border-gray-300 rounded-md bg-white',
          'focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          isOpen && 'ring-2 ring-teal border-transparent'
        )}
      >
        <div className="flex-1 flex flex-wrap gap-1">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            selectedOptions.map(opt => (
              <span
                key={opt.value}
                className="inline-flex items-center px-2 py-0.5 rounded bg-teal-100 text-teal-dark text-xs"
              >
                {opt.value}
                {!disabled && (
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-teal"
                    onClick={(e) => handleRemove(opt.value, e)}
                  />
                )}
              </span>
            ))
          )}
        </div>
        <div className="flex items-center space-x-1 ml-2">
          {selectedValues.length > 0 && !disabled && (
            <X
              className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={handleClearAll}
            />
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-gray-400 transition-transform flex-shrink-0',
              isOpen && 'transform rotate-180'
            )}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Taper pour rechercher..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal"
              />
            </div>
            {selectedValues.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                {selectedValues.length} sélectionné(s)
              </div>
            )}
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                Aucun résultat pour "{search}"
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggle(option.value)}
                    className={cn(
                      'w-full px-3 py-2 text-sm text-left hover:bg-teal-50',
                      'focus:outline-none focus:bg-teal-50 flex items-center',
                      isSelected && 'bg-teal-100'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 border rounded mr-3 flex items-center justify-center flex-shrink-0',
                      isSelected ? 'bg-teal border-teal' : 'border-gray-300'
                    )}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{option.value}</div>
                      {option.sublabel && (
                        <div className="text-xs text-gray-500 truncate">{option.sublabel}</div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
