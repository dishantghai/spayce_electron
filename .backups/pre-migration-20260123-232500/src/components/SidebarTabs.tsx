import React from 'react';
import { Globe, LayoutGrid, Laptop2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import styles from './SidebarTabs.module.css';

export type SidebarTabId = 'browser' | 'spaces' | 'workspace';

interface TabConfig {
    id: SidebarTabId;
    label: string;
    icon: LucideIcon;
}

const TABS: TabConfig[] = [
    { id: 'browser', label: 'Browser', icon: Globe },
    { id: 'spaces', label: 'Spaces', icon: LayoutGrid },
    { id: 'workspace', label: 'Workspace', icon: Laptop2 },
];

export interface SidebarTabsProps {
    activeTab: SidebarTabId;
    onTabChange: (tab: SidebarTabId) => void;
}

export function SidebarTabs({ activeTab, onTabChange }: SidebarTabsProps): React.ReactElement {
    return (
        <nav className={styles.tabs}>
            {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        className={`${styles.tab} ${isActive ? styles.active : ''}`}
                        onClick={() => onTabChange(tab.id)}
                        aria-current={isActive ? 'page' : undefined}
                        title={tab.label}
                    >
                        <Icon size={18} className={styles.icon} />
                        <span className={styles.label}>{tab.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
