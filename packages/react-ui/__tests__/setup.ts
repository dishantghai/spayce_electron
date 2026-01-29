import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Auto cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock window.electronAPI globally for all tests
global.window = global.window || {};
(global.window as any).electronAPI = {
    clipboard: {
        writeText: () => Promise.resolve(),
        readText: () => Promise.resolve(''),
    },
    items: {
        pasteItem: () => Promise.resolve(),
        getSpaceItems: () => Promise.resolve({ items: [], success: true }),
        createItem: () => Promise.resolve({ success: true }),
        deleteItem: () => Promise.resolve({ success: true }),
        renameItem: () => Promise.resolve({ success: true }),
        moveItem: () => Promise.resolve({ success: true }),
        reorderItems: () => Promise.resolve({ success: true }),
        updateMetadata: () => Promise.resolve({ success: true }),
        incrementVisitCount: () => Promise.resolve({ success: true }),
    },
    pins: {
        pinItem: () => Promise.resolve({ success: true }),
        unpinItem: () => Promise.resolve({ success: true }),
        reorderPins: () => Promise.resolve({ success: true }),
        getPinnedItems: () => Promise.resolve({ items: [], success: true }),
    },
    spaces: {
        getSpaces: () => Promise.resolve({ spaces: [], success: true }),
        createSpace: () => Promise.resolve({ success: true, space: {} }),
        deleteSpace: () => Promise.resolve({ success: true }),
        renameSpace: () => Promise.resolve({ success: true }),
        updateSpace: () => Promise.resolve({ success: true }),
        reorderSpaces: () => Promise.resolve({ success: true }),
    },
    eventBus: {
        subscribe: () => () => { },
        unsubscribe: () => { },
    },
};
