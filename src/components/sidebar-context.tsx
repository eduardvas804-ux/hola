'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface SidebarContextType {
    collapsed: boolean;
    setCollapsed: (value: boolean) => void;
    toggleCollapsed: () => void;
    mobileOpen: boolean;
    setMobileOpen: (value: boolean) => void;
    toggleMobile: () => void;
    isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
    collapsed: false,
    setCollapsed: () => { },
    toggleCollapsed: () => { },
    mobileOpen: false,
    setMobileOpen: () => { },
    toggleMobile: () => { },
    isMobile: false,
});

export const useSidebar = () => useContext(SidebarContext);

const STORAGE_KEY = 'sidebar-collapsed';

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [collapsed, setCollapsedState] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Cargar estado del sidebar desde localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
            setCollapsedState(saved === 'true');
        }
    }, []);

    // Guardar estado en localStorage
    const setCollapsed = useCallback((value: boolean) => {
        setCollapsedState(value);
        localStorage.setItem(STORAGE_KEY, String(value));
    }, []);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setMobileOpen(false);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggleCollapsed = useCallback(() => {
        setCollapsed(!collapsed);
    }, [collapsed, setCollapsed]);

    const toggleMobile = () => setMobileOpen(prev => !prev);

    return (
        <SidebarContext.Provider value={{
            collapsed,
            setCollapsed,
            toggleCollapsed,
            mobileOpen,
            setMobileOpen,
            toggleMobile,
            isMobile
        }}>
            {children}
        </SidebarContext.Provider>
    );
}
