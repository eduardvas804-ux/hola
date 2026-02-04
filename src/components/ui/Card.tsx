'use client';

import { LucideIcon } from 'lucide-react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    onClick?: () => void;
}

const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
};

export default function Card({
    children,
    className = '',
    hover = true,
    padding = 'md',
    onClick,
}: CardProps) {
    return (
        <div
            className={`
                bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700
                shadow-sm transition-all duration-300
                ${hover ? 'hover:shadow-lg hover:-translate-y-0.5' : ''}
                ${paddingStyles[padding]}
                ${onClick ? 'cursor-pointer' : ''}
                ${className}
            `}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

// Card Header
interface CardHeaderProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    iconColor?: string;
    action?: React.ReactNode;
    className?: string;
}

export function CardHeader({
    title,
    subtitle,
    icon: Icon,
    iconColor = 'text-blue-500',
    action,
    className = '',
}: CardHeaderProps) {
    return (
        <div className={`flex items-center justify-between mb-4 ${className}`}>
            <div className="flex items-center gap-3">
                {Icon && (
                    <div className={`w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${iconColor}`}>
                        <Icon size={22} />
                    </div>
                )}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

// Card Footer
export function CardFooter({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 ${className}`}>
            {children}
        </div>
    );
}

// Stat Card (ready-made)
interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    trend?: { value: number; label?: string };
    subtitle?: string;
    className?: string;
    onClick?: () => void;
}

const variantColors = {
    default: { iconBg: 'bg-gray-100 dark:bg-gray-700', iconColor: 'text-gray-600 dark:text-gray-300' },
    success: { iconBg: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
    warning: { iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400' },
    danger: { iconBg: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400' },
    info: { iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
};

export function StatCard({
    title,
    value,
    icon: Icon,
    variant = 'default',
    trend,
    subtitle,
    className = '',
    onClick,
}: StatCardProps) {
    const colors = variantColors[variant];

    return (
        <Card className={className} onClick={onClick}>
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl ${colors.iconBg} ${colors.iconColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={28} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {title}
                    </p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                            {typeof value === 'number' ? value.toLocaleString('es-PE') : value}
                        </p>
                        {trend && (
                            <span className={`text-sm font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        </Card>
    );
}

// Card Grid
export function CardGrid({
    children,
    columns = 4,
    className = '',
}: {
    children: React.ReactNode;
    columns?: 1 | 2 | 3 | 4 | 5 | 6;
    className?: string;
}) {
    const colStyles = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
        6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    };

    return (
        <div className={`grid ${colStyles[columns]} gap-4 ${className}`}>
            {children}
        </div>
    );
}
