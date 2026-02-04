'use client';

import { LucideIcon, Inbox, Search, FileX, AlertCircle, Plus } from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
    variant?: 'default' | 'search' | 'error' | 'no-data';
    className?: string;
}

const variantConfig = {
    default: {
        icon: Inbox,
        iconColor: 'text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
    search: {
        icon: Search,
        iconColor: 'text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    error: {
        icon: AlertCircle,
        iconColor: 'text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    'no-data': {
        icon: FileX,
        iconColor: 'text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    },
};

export default function EmptyState({
    icon,
    title,
    description,
    action,
    variant = 'default',
    className = '',
}: EmptyStateProps) {
    const config = variantConfig[variant];
    const Icon = icon || config.icon;
    const ActionIcon = action?.icon || Plus;

    return (
        <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
            <div className={`w-20 h-20 rounded-full ${config.bgColor} flex items-center justify-center mb-4`}>
                <Icon size={40} className={config.iconColor} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                {title}
            </h3>
            {description && (
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-4">
                    {description}
                </p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="btn btn-primary"
                >
                    <ActionIcon size={18} />
                    {action.label}
                </button>
            )}
        </div>
    );
}

// Empty state para tabla
export function TableEmptyState({
    colSpan,
    title = 'No hay datos',
    description = 'No se encontraron registros que coincidan con tu búsqueda',
    action,
}: {
    colSpan: number;
    title?: string;
    description?: string;
    action?: EmptyStateProps['action'];
}) {
    return (
        <tr>
            <td colSpan={colSpan}>
                <EmptyState
                    title={title}
                    description={description}
                    action={action}
                    variant="search"
                />
            </td>
        </tr>
    );
}
