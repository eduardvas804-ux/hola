'use client';

import { LucideIcon, Check, AlertCircle, Clock, XCircle, Loader2 } from 'lucide-react';

type BadgeVariant =
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'operativo'
    | 'mantenimiento'
    | 'inoperativo'
    | 'alquilado'
    | 'urgente'
    | 'proximo'
    | 'en-regla'
    | 'vencido';

interface BadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
    icon?: LucideIcon;
    pulse?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; darkBg: string; darkText: string }> = {
    default: { bg: 'bg-gray-100', text: 'text-gray-700', darkBg: 'dark:bg-gray-700', darkText: 'dark:text-gray-300' },
    success: { bg: 'bg-green-100', text: 'text-green-700', darkBg: 'dark:bg-green-900/30', darkText: 'dark:text-green-400' },
    warning: { bg: 'bg-amber-100', text: 'text-amber-700', darkBg: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-400' },
    danger: { bg: 'bg-red-100', text: 'text-red-700', darkBg: 'dark:bg-red-900/30', darkText: 'dark:text-red-400' },
    info: { bg: 'bg-blue-100', text: 'text-blue-700', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-400' },
    operativo: { bg: 'bg-green-100', text: 'text-green-700', darkBg: 'dark:bg-green-900/30', darkText: 'dark:text-green-400' },
    mantenimiento: { bg: 'bg-amber-100', text: 'text-amber-700', darkBg: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-400' },
    inoperativo: { bg: 'bg-red-100', text: 'text-red-700', darkBg: 'dark:bg-red-900/30', darkText: 'dark:text-red-400' },
    alquilado: { bg: 'bg-blue-100', text: 'text-blue-700', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-400' },
    urgente: { bg: 'bg-red-100', text: 'text-red-700', darkBg: 'dark:bg-red-900/30', darkText: 'dark:text-red-400' },
    proximo: { bg: 'bg-amber-100', text: 'text-amber-700', darkBg: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-400' },
    'en-regla': { bg: 'bg-green-100', text: 'text-green-700', darkBg: 'dark:bg-green-900/30', darkText: 'dark:text-green-400' },
    vencido: { bg: 'bg-red-800', text: 'text-white', darkBg: 'dark:bg-red-900', darkText: 'dark:text-white' },
};

const variantIcons: Partial<Record<BadgeVariant, LucideIcon>> = {
    success: Check,
    operativo: Check,
    'en-regla': Check,
    warning: AlertCircle,
    mantenimiento: Clock,
    proximo: Clock,
    danger: XCircle,
    inoperativo: XCircle,
    urgente: AlertCircle,
    vencido: XCircle,
};

const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
};

export default function Badge({
    variant = 'default',
    children,
    icon,
    pulse = false,
    size = 'md',
    className = '',
}: BadgeProps) {
    const styles = variantStyles[variant];
    const DefaultIcon = variantIcons[variant];
    const Icon = icon || DefaultIcon;

    // Auto-pulse for urgent variants
    const shouldPulse = pulse || variant === 'urgente' || variant === 'vencido';

    return (
        <span
            className={`
                inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wide
                ${styles.bg} ${styles.text} ${styles.darkBg} ${styles.darkText}
                ${sizeStyles[size]}
                ${shouldPulse ? 'animate-pulse' : ''}
                ${className}
            `}
        >
            {Icon && <Icon size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12} />}
            {children}
        </span>
    );
}

// Badge de estado de maquinaria
export function EstadoBadge({ estado }: { estado: string }) {
    const variant = (estado?.toLowerCase() || 'default') as BadgeVariant;
    return (
        <Badge variant={variant}>
            {estado}
        </Badge>
    );
}

// Badge para días restantes
export function DiasRestantesBadge({ dias }: { dias: number }) {
    if (dias <= 0) {
        return <Badge variant="vencido">Vencido ({Math.abs(dias)}d)</Badge>;
    }
    if (dias <= 30) {
        return <Badge variant="proximo">{dias} días</Badge>;
    }
    return <Badge variant="en-regla">{dias} días</Badge>;
}

// Loading Badge
export function LoadingBadge({ text = 'Cargando...' }: { text?: string }) {
    return (
        <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 rounded-full">
            <Loader2 size={12} className="animate-spin" />
            {text}
        </span>
    );
}
