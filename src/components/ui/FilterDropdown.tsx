'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

interface FilterOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
    sublabel?: string;
}

interface FilterDropdownProps {
    options: FilterOption[];
    value: string | string[];
    onChange: (value: string | string[]) => void;
    placeholder?: string;
    label?: string;
    searchable?: boolean;
    multiple?: boolean;
    className?: string;
    clearable?: boolean;
}

export default function FilterDropdown({
    options,
    value,
    onChange,
    placeholder = 'Seleccionar...',
    label,
    searchable = true,
    multiple = false,
    className = '',
    clearable = true,
}: FilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter options by search
    const filteredOptions = options.filter(
        (opt) =>
            opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            opt.sublabel?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get selected labels
    const selectedLabelsArr = options.filter((opt) => (value as string[]).includes(opt.value)).map((opt) => opt.label);
    const selectedLabel = options.find((opt) => opt.value === value)?.label;

    // Handle selection
    function handleSelect(optionValue: string) {
        if (multiple) {
            const currentValues = value as string[];
            const newValues = currentValues.includes(optionValue)
                ? currentValues.filter((v) => v !== optionValue)
                : [...currentValues, optionValue];
            onChange(newValues);
        } else {
            onChange(optionValue);
            setIsOpen(false);
        }
        setSearchTerm('');
    }

    // Handle clear
    function handleClear(e: React.MouseEvent) {
        e.stopPropagation();
        onChange(multiple ? [] : '');
    }

    const hasValue = multiple ? (value as string[]).length > 0 : value !== '';

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                </label>
            )}

            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full input flex items-center justify-between text-left
                    ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
                `}
            >
                <span className={hasValue ? 'text-gray-800 dark:text-white' : 'text-gray-400'}>
                    {hasValue
                        ? multiple
                            ? `${selectedLabelsArr.length} seleccionado${selectedLabelsArr.length > 1 ? 's' : ''}`
                            : selectedLabel
                        : placeholder}
                </span>
                <div className="flex items-center gap-1">
                    {hasValue && clearable && (
                        <button
                            onClick={handleClear}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                            <X size={16} className="text-gray-400" />
                        </button>
                    )}
                    <ChevronDown
                        size={18}
                        className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-hidden animate-slideDown">
                    {/* Search */}
                    {searchable && (
                        <div className="p-2 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    )}

                    {/* Options */}
                    <div className="overflow-y-auto max-h-60">
                        {!multiple && (
                            <button
                                onClick={() => {
                                    onChange('');
                                    setIsOpen(false);
                                }}
                                className={`
                                    w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2
                                    ${!hasValue ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}
                                `}
                            >
                                Todos
                            </button>
                        )}
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                No se encontraron resultados
                            </div>
                        ) : (
                            filteredOptions.map((option) => {
                                const isSelected = multiple
                                    ? (value as string[]).includes(option.value)
                                    : value === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => handleSelect(option.value)}
                                        className={`
                                            w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2
                                            ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}
                                        `}
                                    >
                                        {multiple && (
                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-500'}`}>
                                                {isSelected && <Check size={12} className="text-white" />}
                                            </div>
                                        )}
                                        {option.icon && <span className="text-lg">{option.icon}</span>}
                                        <div className="flex-1 min-w-0">
                                            <span className="font-medium">{option.label}</span>
                                            {option.sublabel && (
                                                <span className="text-gray-400 dark:text-gray-500 ml-2">
                                                    ({option.sublabel})
                                                </span>
                                            )}
                                        </div>
                                        {!multiple && isSelected && (
                                            <Check size={16} className="text-blue-600" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Selected chips for multiple selection */}
            {multiple && (value as string[]).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {(value as string[]).slice(0, 3).map((v) => {
                        const option = options.find((opt) => opt.value === v);
                        return (
                            <span
                                key={v}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full"
                            >
                                {option?.label}
                                <button
                                    onClick={() => handleSelect(v)}
                                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        );
                    })}
                    {(value as string[]).length > 3 && (
                        <span className="text-xs text-gray-500 py-1">
                            +{(value as string[]).length - 3} más
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
