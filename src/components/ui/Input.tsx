'use client';

import { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    success?: boolean;
}

export default function Input({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    success,
    className = '',
    type = 'text',
    ...props
}: InputProps) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {leftIcon}
                    </div>
                )}
                <input
                    type={inputType}
                    className={`
                        w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
                        bg-white dark:bg-gray-800
                        text-gray-900 dark:text-white
                        placeholder:text-gray-400 dark:placeholder:text-gray-500
                        ${leftIcon ? 'pl-11' : ''}
                        ${rightIcon || isPassword ? 'pr-11' : ''}
                        ${error
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : success
                                ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                                : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                        }
                        focus:outline-none focus:ring-4
                        disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60
                    `}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                )}
                {!isPassword && rightIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {rightIcon}
                    </div>
                )}
                {error && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                        <AlertCircle size={20} />
                    </div>
                )}
                {success && !error && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                        <Check size={20} />
                    </div>
                )}
            </div>
            {(error || helperText) && (
                <p className={`mt-1.5 text-sm ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
}

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export function Textarea({
    label,
    error,
    helperText,
    className = '',
    ...props
}: TextareaProps) {
    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <textarea
                className={`
                    w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
                    bg-white dark:bg-gray-800
                    text-gray-900 dark:text-white
                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                    ${error
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                    }
                    focus:outline-none focus:ring-4
                    min-h-[120px] resize-none
                `}
                {...props}
            />
            {(error || helperText) && (
                <p className={`mt-1.5 text-sm ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
}

// Select Component
interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
    label?: string;
    error?: string;
    options: SelectOption[];
    placeholder?: string;
}

export function Select({
    label,
    error,
    options,
    placeholder,
    className = '',
    ...props
}: SelectProps) {
    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <select
                className={`
                    w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 select
                    bg-white dark:bg-gray-800
                    text-gray-900 dark:text-white
                    ${error
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                    }
                    focus:outline-none focus:ring-4
                `}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="mt-1.5 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
}
