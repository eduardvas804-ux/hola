'use client';

import { useState, useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Search,
    CheckSquare,
    Square
} from 'lucide-react';

export interface Column<T> {
    key: keyof T | string;
    header: string;
    sortable?: boolean;
    render?: (item: T, index: number) => React.ReactNode;
    className?: string;
    width?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    pageSize?: number;
    searchable?: boolean;
    searchPlaceholder?: string;
    selectable?: boolean;
    selectedItems?: Set<string>;
    onSelectionChange?: (selected: Set<string>) => void;
    getRowId?: (item: T) => string;
    emptyMessage?: string;
    loading?: boolean;
    onRowClick?: (item: T) => void;
    stickyHeader?: boolean;
}

export default function DataTable<T extends Record<string, any>>({
    data,
    columns,
    pageSize = 10,
    searchable = true,
    searchPlaceholder = 'Buscar...',
    selectable = false,
    selectedItems = new Set(),
    onSelectionChange,
    getRowId = (item) => item.id,
    emptyMessage = 'No hay datos disponibles',
    loading = false,
    onRowClick,
    stickyHeader = false,
}: DataTableProps<T>) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Filter data by search term
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const term = searchTerm.toLowerCase();
        return data.filter((item) =>
            columns.some((col) => {
                const value = item[col.key as keyof T];
                return value?.toString().toLowerCase().includes(term);
            })
        );
    }, [data, searchTerm, columns]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortConfig) return filteredData;
        return [...filteredData].sort((a, b) => {
            const aValue = a[sortConfig.key as keyof T];
            const bValue = b[sortConfig.key as keyof T];
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    // Paginate data
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);

    // Handle sort
    function handleSort(key: string) {
        setSortConfig((prev) => {
            if (prev?.key === key) {
                return prev.direction === 'asc'
                    ? { key, direction: 'desc' }
                    : null;
            }
            return { key, direction: 'asc' };
        });
    }

    // Handle selection
    function toggleSelectItem(id: string) {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        onSelectionChange?.(newSelected);
    }

    function toggleSelectAll() {
        if (selectedItems.size === paginatedData.length) {
            onSelectionChange?.(new Set());
        } else {
            onSelectionChange?.(new Set(paginatedData.map(getRowId)));
        }
    }

    // Render sort icon
    function renderSortIcon(key: string) {
        if (sortConfig?.key !== key) {
            return <ArrowUpDown size={14} className="text-gray-400" />;
        }
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} className="text-white" />
            : <ArrowDown size={14} className="text-white" />;
    }

    if (loading) {
        return (
            <div className="card overflow-hidden animate-pulse">
                <div className="p-4 bg-gray-100 dark:bg-gray-800">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-64"></div>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-4 flex gap-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="card overflow-hidden">
            {/* Search Bar */}
            {searchable && (
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            className="input pl-10"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="data-table table-card-view">
                    <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
                        <tr>
                            {selectable && (
                                <th className="w-10">
                                    <button
                                        onClick={toggleSelectAll}
                                        className="p-1 hover:bg-white/10 rounded transition-colors"
                                    >
                                        {selectedItems.size === paginatedData.length && paginatedData.length > 0 ? (
                                            <CheckSquare size={18} className="text-white" />
                                        ) : (
                                            <Square size={18} className="text-white/60" />
                                        )}
                                    </button>
                                </th>
                            )}
                            {columns.map((col) => (
                                <th
                                    key={String(col.key)}
                                    className={col.className}
                                    style={{ width: col.width }}
                                >
                                    {col.sortable ? (
                                        <button
                                            onClick={() => handleSort(String(col.key))}
                                            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                        >
                                            {col.header}
                                            {renderSortIcon(String(col.key))}
                                        </button>
                                    ) : (
                                        col.header
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (selectable ? 1 : 0)}
                                    className="text-center py-12 text-gray-500 dark:text-gray-400"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, index) => {
                                const rowId = getRowId(item);
                                const isSelected = selectedItems.has(rowId);
                                return (
                                    <tr
                                        key={rowId}
                                        className={`
                                            ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                                            ${onRowClick ? 'cursor-pointer' : ''}
                                        `}
                                        onClick={() => onRowClick?.(item)}
                                    >
                                        {selectable && (
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => toggleSelectItem(rowId)}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare size={18} className="text-blue-600" />
                                                    ) : (
                                                        <Square size={18} className="text-gray-400" />
                                                    )}
                                                </button>
                                            </td>
                                        )}
                                        {columns.map((col) => (
                                            <td key={String(col.key)} className={col.className}>
                                                {col.render
                                                    ? col.render(item, index)
                                                    : String(item[col.key as keyof T] ?? '')}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedData.length)} de {sortedData.length}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronsLeft size={18} />
                        </button>
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <div className="flex items-center gap-1 mx-2">
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                                            ? 'bg-primary text-white'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        style={currentPage === pageNum ? { background: 'var(--primary)' } : {}}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronsRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
