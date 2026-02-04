'use client';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

export default function Skeleton({
    className = '',
    variant = 'rectangular',
    width,
    height,
    animation = 'pulse',
}: SkeletonProps) {
    const variantClasses = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'animate-shimmer',
        none: '',
    };

    return (
        <div
            className={`
                bg-gray-200 dark:bg-gray-700
                ${variantClasses[variant]}
                ${animationClasses[animation]}
                ${className}
            `}
            style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
            }}
        />
    );
}

// Skeleton para tabla
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <Skeleton width="200px" height="40px" />
            </div>

            {/* Table header */}
            <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                {[...Array(columns)].map((_, i) => (
                    <Skeleton key={i} height="20px" className="flex-1" />
                ))}
            </div>

            {/* Table rows */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {[...Array(rows)].map((_, i) => (
                    <div key={i} className="flex gap-4 p-4">
                        {[...Array(columns)].map((_, j) => (
                            <Skeleton key={j} height="20px" className="flex-1" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Skeleton para cards de estadísticas
export function StatsCardSkeleton() {
    return (
        <div className="card p-5 animate-pulse">
            <div className="flex items-center gap-4">
                <Skeleton variant="rectangular" width={56} height={56} />
                <div className="flex-1 space-y-2">
                    <Skeleton height={16} width="60%" />
                    <Skeleton height={32} width="40%" />
                </div>
            </div>
        </div>
    );
}

// Skeleton para grid de stats
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(count)].map((_, i) => (
                <StatsCardSkeleton key={i} />
            ))}
        </div>
    );
}

// Skeleton para dashboard completo
export function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton height={36} width={300} />
                    <Skeleton height={20} width={200} />
                </div>
                <Skeleton height={40} width={150} />
            </div>

            {/* Stats Grid */}
            <StatsGridSkeleton count={5} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card p-5 lg:col-span-1">
                    <Skeleton height={24} width={150} className="mb-4" />
                    <Skeleton height={300} />
                </div>
                <div className="card p-5 lg:col-span-2">
                    <Skeleton height={24} width={200} className="mb-4" />
                    <Skeleton height={300} />
                </div>
            </div>

            {/* Table */}
            <TableSkeleton rows={6} columns={6} />
        </div>
    );
}

// Skeleton para formulario
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
    return (
        <div className="space-y-4 animate-pulse">
            {[...Array(fields)].map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton height={16} width={100} />
                    <Skeleton height={44} />
                </div>
            ))}
            <div className="flex justify-end gap-3 pt-4">
                <Skeleton height={44} width={100} />
                <Skeleton height={44} width={120} />
            </div>
        </div>
    );
}
