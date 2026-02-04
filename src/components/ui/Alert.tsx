'use client';

import { X, AlertCircle, CheckCircle, AlertTriangle, Info, LucideIcon } from 'lucide-react';
import { useState } from 'react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
    variant?: AlertVariant;
    title?: string;
    children: React.ReactNode;
    icon?: LucideIcon;
    dismissible?: boolean;
    onDismiss?: () => void;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

const variantConfig: Record<AlertVariant, { icon: LucideIcon; bg: string; border: string; text: string; iconColor: string }> = {
    info: {
        icon: Info,
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-800 dark:text-blue-200',
        iconColor: 'text-blue-500 dark:text-blue-400',
    },
    success: {
        icon: CheckCircle,
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-800 dark:text-green-200',
        iconColor: 'text-green-500 dark:text-green-400',
    },
    warning: {
        icon: AlertTriangle,
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800',
        text: 'text-amber-800 dark:text-amber-200',
        iconColor: 'text-amber-500 dark:text-amber-400',
    },
    error: {
        icon: AlertCircle,
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-800 dark:text-red-200',
        iconColor: 'text-red-500 dark:text-red-400',
    },
};

export default function Alert({
    variant = 'info',
    title,
    children,
    icon,
    dismissible = false,
    onDismiss,
    action,
    className = '',
}: AlertProps) {
    const [isVisible, setIsVisible] = useState(true);
    const config = variantConfig[variant];
    const Icon = icon || config.icon;

    const handleDismiss = () => {
        setIsVisible(false);
        onDismiss?.();
    };

    if (!isVisible) return null;

    return (
        <div
            className={`
                flex gap-3 p-4 rounded-xl border
                ${config.bg} ${config.border}
                animate-fadeIn
                ${className}
            `}
            role="alert"
        >
            <div className={`flex-shrink-0 ${config.iconColor}`}>
                <Icon size={22} />
            </div>
            <div className="flex-1 min-w-0">
                {title && (
                    <h4 className={`font-semibold mb-1 ${config.text}`}>
                        {title}
                    </h4>
                )}
                <div className={`text-sm ${config.text} opacity-90`}>
                    {children}
                </div>
                {action && (
                    <button
                        onClick={action.onClick}
                        className={`mt-2 text-sm font-medium underline hover:no-underline ${config.text}`}
                    >
                        {action.label}
                    </button>
                )}
            </div>
            {dismissible && (
                <button
                    onClick={handleDismiss}
                    className={`flex-shrink-0 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${config.text}`}
                    aria-label="Cerrar alerta"
                >
                    <X size={18} />
                </button>
            )}
        </div>
    );
}

// Alert banner for top of page
interface AlertBannerProps extends Omit<AlertProps, 'className'> {
    sticky?: boolean;
}

export function AlertBanner({ sticky = false, ...props }: AlertBannerProps) {
    return (
        <Alert
            {...props}
            className={`rounded-none border-x-0 ${sticky ? 'sticky top-0 z-40' : ''}`}
        />
    );
}
