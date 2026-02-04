'use client';

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { AlertTriangle, Trash2, X, Info, CheckCircle, AlertCircle } from 'lucide-react';

// ============================================
// TYPES
// ============================================

type DialogVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmDialogOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: DialogVariant;
    icon?: ReactNode;
}

interface ConfirmDialogState extends ConfirmDialogOptions {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

interface ConfirmDialogContextValue {
    confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
    confirmDelete: (itemName: string) => Promise<boolean>;
    confirmBulkDelete: (count: number) => Promise<boolean>;
}

// ============================================
// CONTEXT
// ============================================

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function useConfirmDialog() {
    const context = useContext(ConfirmDialogContext);
    if (!context) {
        throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
    }
    return context;
}

// ============================================
// PROVIDER
// ============================================

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<ConfirmDialogState>({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        variant: 'danger',
        onConfirm: () => { },
        onCancel: () => { },
    });

    const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                ...options,
                confirmText: options.confirmText || 'Confirmar',
                cancelText: options.cancelText || 'Cancelar',
                variant: options.variant || 'danger',
                onConfirm: () => {
                    setState(prev => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setState(prev => ({ ...prev, isOpen: false }));
                    resolve(false);
                },
            });
        });
    }, []);

    const confirmDelete = useCallback((itemName: string): Promise<boolean> => {
        return confirm({
            title: '¿Eliminar registro?',
            message: `Estás a punto de eliminar "${itemName}". Esta acción no se puede deshacer.`,
            confirmText: 'Sí, eliminar',
            cancelText: 'Cancelar',
            variant: 'danger',
            icon: <Trash2 size={24} />,
        });
    }, [confirm]);

    const confirmBulkDelete = useCallback((count: number): Promise<boolean> => {
        return confirm({
            title: '¿Eliminar múltiples registros?',
            message: `Estás a punto de eliminar ${count} registro${count > 1 ? 's' : ''}. Esta acción no se puede deshacer.`,
            confirmText: `Eliminar ${count}`,
            cancelText: 'Cancelar',
            variant: 'danger',
            icon: <Trash2 size={24} />,
        });
    }, [confirm]);

    return (
        <ConfirmDialogContext.Provider value={{ confirm, confirmDelete, confirmBulkDelete }}>
            {children}
            <ConfirmDialog {...state} />
        </ConfirmDialogContext.Provider>
    );
}

// ============================================
// DIALOG COMPONENT
// ============================================

function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    variant,
    icon,
    onConfirm,
    onCancel,
}: ConfirmDialogState) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            iconBg: 'bg-red-100 dark:bg-red-900/30',
            iconColor: 'text-red-600 dark:text-red-400',
            buttonBg: 'bg-red-600 hover:bg-red-700',
        },
        warning: {
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            iconColor: 'text-amber-600 dark:text-amber-400',
            buttonBg: 'bg-amber-600 hover:bg-amber-700',
        },
        info: {
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
            buttonBg: 'bg-blue-600 hover:bg-blue-700',
        },
        success: {
            iconBg: 'bg-green-100 dark:bg-green-900/30',
            iconColor: 'text-green-600 dark:text-green-400',
            buttonBg: 'bg-green-600 hover:bg-green-700',
        },
    };

    const styles = variantStyles[variant || 'danger'];

    const defaultIcons = {
        danger: <AlertTriangle size={24} />,
        warning: <AlertCircle size={24} />,
        info: <Info size={24} />,
        success: <CheckCircle size={24} />,
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start gap-4 p-6">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full ${styles.iconBg} ${styles.iconColor} flex items-center justify-center`}>
                        {icon || defaultIcons[variant || 'danger']}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {title}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${styles.buttonBg}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;
