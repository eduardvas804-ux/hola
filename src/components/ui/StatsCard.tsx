'use client';

import { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    subtitle?: string;
    animate?: boolean;
    onClick?: () => void;
    className?: string;
}

const variantStyles = {
    default: {
        iconBg: 'from-slate-500 to-slate-600',
        border: 'border-l-slate-500',
        text: 'text-slate-600',
    },
    success: {
        iconBg: 'from-green-500 to-green-600',
        border: 'border-l-green-500',
        text: 'text-green-600',
    },
    warning: {
        iconBg: 'from-amber-500 to-amber-600',
        border: 'border-l-amber-500',
        text: 'text-amber-600',
    },
    danger: {
        iconBg: 'from-red-500 to-red-600',
        border: 'border-l-red-500',
        text: 'text-red-600',
    },
    info: {
        iconBg: 'from-blue-500 to-blue-600',
        border: 'border-l-blue-500',
        text: 'text-blue-600',
    },
};

export default function StatsCard({
    title,
    value,
    icon: Icon,
    trend,
    variant = 'default',
    subtitle,
    animate = true,
    onClick,
    className = '',
}: StatsCardProps) {
    const [displayValue, setDisplayValue] = useState(animate && typeof value === 'number' ? 0 : value);
    const styles = variantStyles[variant];

    // Animate number counting
    useEffect(() => {
        if (!animate || typeof value !== 'number') {
            setDisplayValue(value);
            return;
        }

        const duration = 1000;
        const steps = 30;
        const increment = value / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current += increment;
            if (step >= steps) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.round(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value, animate]);

    return (
        <div
            className={`
                stat-card ${styles.border} border-l-4
                ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}
                transition-all duration-300
                ${className}
            `}
            onClick={onClick}
        >
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${styles.iconBg} flex items-center justify-center shadow-lg`}>
                    <Icon className="text-white" size={28} />
                </div>
                <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <p className={`text-3xl font-bold ${styles.text}`}>
                            {typeof displayValue === 'number'
                                ? displayValue.toLocaleString('es-PE')
                                : displayValue}
                        </p>
                        {trend && (
                            <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Grid de stats cards
interface StatsGridProps {
    children: React.ReactNode;
    columns?: 2 | 3 | 4 | 5;
}

export function StatsGrid({ children, columns = 4 }: StatsGridProps) {
    const colClasses = {
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    };

    return (
        <div className={`grid ${colClasses[columns]} gap-4`}>
            {children}
        </div>
    );
}
