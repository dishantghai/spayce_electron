/**
 * Feature Flags for Spayce
 * 
 * Controls gradual rollout of new features.
 * Can be overridden via URL parameters for testing.
 */

export interface FeatureFlagsConfig {
    /** Use React Arborist for tree rendering instead of legacy custom implementation */
    USE_ARBORIST_TREE: boolean;
}

export const FeatureFlags: FeatureFlagsConfig = {
    // Default to legacy tree for safety during migration
    USE_ARBORIST_TREE: false,
};

// Environment override via URL parameters (for testing)
if (typeof window !== 'undefined' && window.location?.search) {
    const params = new URLSearchParams(window.location.search);

    // ?arborist=true enables React Arborist tree
    if (params.get('arborist') === 'true') {
        FeatureFlags.USE_ARBORIST_TREE = true;
        console.log('[FeatureFlags] Arborist tree enabled via URL param');
    }
}

// Export individual flags for convenience
export const useArboristTree = () => FeatureFlags.USE_ARBORIST_TREE;
