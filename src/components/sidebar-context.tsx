'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

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

    const toggleCollapsed = () => setCollapsed(prev => !prev);
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
