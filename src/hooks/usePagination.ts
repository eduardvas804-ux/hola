'use client';

import { useState, useMemo, useCallback } from 'react';

interface UsePaginationOptions {
    initialPage?: number;
    initialPageSize?: number;
    totalItems: number;
}

interface UsePaginationReturn<T> {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    goToPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    firstPage: () => void;
    lastPage: () => void;
    setPageSize: (size: number) => void;
    paginateData: (data: T[]) => T[];
    pageNumbers: number[];
}

export default function usePagination<T = any>({
    initialPage = 1,
    initialPageSize = 10,
    totalItems,
}: UsePaginationOptions): UsePaginationReturn<T> {
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [pageSize, setPageSizeState] = useState(initialPageSize);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(totalItems / pageSize)),
        [totalItems, pageSize]
    );

    // Ensure current page is within bounds
    const validCurrentPage = useMemo(
        () => Math.min(Math.max(1, currentPage), totalPages),
        [currentPage, totalPages]
    );

    const startIndex = useMemo(
        () => (validCurrentPage - 1) * pageSize,
        [validCurrentPage, pageSize]
    );

    const endIndex = useMemo(
        () => Math.min(startIndex + pageSize, totalItems),
        [startIndex, pageSize, totalItems]
    );

    const hasPrevPage = validCurrentPage > 1;
    const hasNextPage = validCurrentPage < totalPages;

    const goToPage = useCallback((page: number) => {
        setCurrentPage(Math.min(Math.max(1, page), totalPages));
    }, [totalPages]);

    const nextPage = useCallback(() => {
        if (hasNextPage) {
            setCurrentPage((p) => p + 1);
        }
    }, [hasNextPage]);

    const prevPage = useCallback(() => {
        if (hasPrevPage) {
            setCurrentPage((p) => p - 1);
        }
    }, [hasPrevPage]);

    const firstPage = useCallback(() => {
        setCurrentPage(1);
    }, []);

    const lastPage = useCallback(() => {
        setCurrentPage(totalPages);
    }, [totalPages]);

    const setPageSize = useCallback((size: number) => {
        setPageSizeState(size);
        setCurrentPage(1);
    }, []);

    const paginateData = useCallback(
        (data: T[]) => data.slice(startIndex, endIndex),
        [startIndex, endIndex]
    );

    // Generate page numbers for pagination UI
    const pageNumbers = useMemo(() => {
        const range = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                range.push(i);
            }
        } else if (validCurrentPage <= 3) {
            for (let i = 1; i <= maxVisible; i++) {
                range.push(i);
            }
        } else if (validCurrentPage >= totalPages - 2) {
            for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
                range.push(i);
            }
        } else {
            for (let i = validCurrentPage - 2; i <= validCurrentPage + 2; i++) {
                range.push(i);
            }
        }

        return range;
    }, [totalPages, validCurrentPage]);

    return {
        currentPage: validCurrentPage,
        pageSize,
        totalPages,
        startIndex,
        endIndex,
        hasPrevPage,
        hasNextPage,
        goToPage,
        nextPage,
        prevPage,
        firstPage,
        lastPage,
        setPageSize,
        paginateData,
        pageNumbers,
    };
}
