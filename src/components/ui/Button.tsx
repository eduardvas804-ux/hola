'use client';

import { LucideIcon, Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    loadingText?: string;
    fullWidth?: boolean;
    rounded?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: `
        bg-gradient-to-r from-blue-600 to-blue-700 
        hover:from-blue-700 hover:to-blue-800 
        text-white shadow-lg shadow-blue-500/25 
        hover:shadow-xl hover:shadow-blue-500/30
        dark:from-blue-500 dark:to-blue-600
    `,
    secondary: `
        bg-gradient-to-r from-emerald-600 to-emerald-700 
        hover:from-emerald-700 hover:to-emerald-800 
        text-white shadow-lg shadow-emerald-500/25
        dark:from-emerald-500 dark:to-emerald-600
    `,
    danger: `
        bg-gradient-to-r from-red-600 to-red-700 
        hover:from-red-700 hover:to-red-800 
        text-white shadow-lg shadow-red-500/25
    `,
    success: `
        bg-gradient-to-r from-green-600 to-green-700 
        hover:from-green-700 hover:to-green-800 
        text-white shadow-lg shadow-green-500/25
    `,
    warning: `
        bg-gradient-to-r from-amber-500 to-amber-600 
        hover:from-amber-600 hover:to-amber-700 
        text-white shadow-lg shadow-amber-500/25
    `,
    outline: `
        bg-transparent border-2 border-blue-600 text-blue-600 
        hover:bg-blue-600 hover:text-white
        dark:border-blue-400 dark:text-blue-400
        dark:hover:bg-blue-500 dark:hover:text-white
    `,
    ghost: `
        bg-transparent text-gray-600 
        hover:bg-gray-100 hover:text-gray-900
        dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white
    `,
    link: `
        bg-transparent text-blue-600 hover:text-blue-700 hover:underline
        dark:text-blue-400 dark:hover:text-blue-300
        shadow-none p-0
    `,
};

const sizeStyles: Record<ButtonSize, string> = {
    xs: 'px-2.5 py-1.5 text-xs rounded-lg gap-1',
    sm: 'px-3 py-2 text-sm rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3 text-base rounded-xl gap-2',
    xl: 'px-8 py-4 text-lg rounded-2xl gap-3',
};

const iconSizes: Record<ButtonSize, number> = {
    xs: 14,
    sm: 16,
    md: 18,
    lg: 20,
    xl: 24,
};

export default function Button({
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    loadingText,
    fullWidth = false,
    rounded = false,
    className = '',
    children,
    disabled,
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading;
    const iconSize = iconSizes[size];

    return (
        <button
            className={`
                inline-flex items-center justify-center font-semibold
                transition-all duration-200 transform
                hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${fullWidth ? 'w-full' : ''}
                ${rounded ? 'rounded-full' : ''}
                ${className}
            `}
            disabled={isDisabled}
            {...props}
        >
            {loading ? (
                <>
                    <Loader2 size={iconSize} className="animate-spin" />
                    {loadingText || children}
                </>
            ) : (
                <>
                    {Icon && iconPosition === 'left' && <Icon size={iconSize} />}
                    {children}
                    {Icon && iconPosition === 'right' && <Icon size={iconSize} />}
                </>
            )}
        </button>
    );
}

// Icon Button
interface IconButtonProps extends Omit<ButtonProps, 'children' | 'icon'> {
    icon: LucideIcon;
    'aria-label': string;
}

export function IconButton({
    icon: Icon,
    variant = 'ghost',
    size = 'md',
    className = '',
    ...props
}: IconButtonProps) {
    const sizeMap = {
        xs: 'w-7 h-7',
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
        xl: 'w-14 h-14',
    };

    return (
        <button
            className={`
                inline-flex items-center justify-center rounded-xl
                transition-all duration-200 transform
                hover:scale-105 active:scale-95
                disabled:opacity-60 disabled:cursor-not-allowed
                ${variantStyles[variant]}
                ${sizeMap[size]}
                ${className}
            `}
            {...props}
        >
            <Icon size={iconSizes[size]} />
        </button>
    );
}

// Button Group
export function ButtonGroup({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`inline-flex rounded-xl overflow-hidden divide-x divide-white/20 ${className}`}>
            {children}
        </div>
    );
}
