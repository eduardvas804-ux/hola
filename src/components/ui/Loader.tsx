'use client';

interface LoaderProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'spinner' | 'dots' | 'bars' | 'pulse';
    color?: 'primary' | 'white' | 'gray';
    text?: string;
    fullScreen?: boolean;
    overlay?: boolean;
}

const sizeMap = {
    sm: { spinner: 20, container: 'h-5 w-5' },
    md: { spinner: 32, container: 'h-8 w-8' },
    lg: { spinner: 48, container: 'h-12 w-12' },
    xl: { spinner: 64, container: 'h-16 w-16' },
};

const colorMap = {
    primary: 'border-t-blue-600 dark:border-t-blue-400',
    white: 'border-t-white',
    gray: 'border-t-gray-600 dark:border-t-gray-400',
};

export default function Loader({
    size = 'md',
    variant = 'spinner',
    color = 'primary',
    text,
    fullScreen = false,
    overlay = false,
}: LoaderProps) {
    const sizeConfig = sizeMap[size];

    const renderLoader = () => {
        switch (variant) {
            case 'spinner':
                return (
                    <div
                        className={`${sizeConfig.container} border-4 border-gray-200 dark:border-gray-700 ${colorMap[color]} rounded-full animate-spin`}
                    />
                );

            case 'dots':
                return (
                    <div className="flex space-x-1">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce`}
                                style={{ animationDelay: `${i * 0.15}s` }}
                            />
                        ))}
                    </div>
                );

            case 'bars':
                return (
                    <div className="flex space-x-1 items-end h-8">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="w-1 bg-blue-600 dark:bg-blue-400 rounded animate-pulse"
                                style={{
                                    height: `${Math.random() * 100}%`,
                                    animationDelay: `${i * 0.1}s`,
                                    animationDuration: '0.8s',
                                }}
                            />
                        ))}
                    </div>
                );

            case 'pulse':
                return (
                    <div className={`${sizeConfig.container} relative`}>
                        <div className="absolute inset-0 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping opacity-75" />
                        <div className="relative rounded-full bg-blue-600 dark:bg-blue-400 w-full h-full" />
                    </div>
                );

            default:
                return null;
        }
    };

    const content = (
        <div className={`flex flex-col items-center justify-center gap-3 ${fullScreen ? 'min-h-screen' : ''}`}>
            {renderLoader()}
            {text && (
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );

    if (overlay) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
                    {content}
                </div>
            </div>
        );
    }

    return content;
}

// Page Loading Component
export function PageLoader({ text = 'Cargando página...' }: { text?: string }) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader size="lg" text={text} />
        </div>
    );
}

// Inline Loading Component
export function InlineLoader({ text }: { text?: string }) {
    return (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Loader size="sm" />
            {text && <span className="text-sm">{text}</span>}
        </div>
    );
}

// Button Loading State
export function ButtonLoader({ className = '' }: { className?: string }) {
    return (
        <span className={`inline-block ${className}`}>
            <Loader size="sm" color="white" />
        </span>
    );
}
