import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * Feature Tier Configuration
 * 
 * TIER STRUCTURE:
 * - FREE: Dashboard, Stress Index, Basic Simulation, Ripple Visualizer, Limited History, Basic Jarvis
 * - PREMIUM: All features including Surplus/Deficit, Transfer Intelligence, Forecast, Advanced Analytics
 * 
 * AUTHENTICATION:
 * - Mock authentication layer (UI-level simulation only)
 * - No backend auth logic - state persisted in localStorage
 */

// Storage key for session persistence
const STORAGE_KEY = 'agro_intel_session';

// Feature definitions with tier requirements
export const FEATURES = {
  // FREE TIER FEATURES
  DASHBOARD: { id: 'dashboard', name: 'Dashboard Overview', tier: 'free' },
  STRESS_INDEX: { id: 'stress_index', name: 'Market Stress Index', tier: 'free' },
  BASIC_SIMULATION: { id: 'basic_simulation', name: 'Shock Simulation', tier: 'free' },
  RIPPLE_VISUALIZER: { id: 'ripple_visualizer', name: 'Ripple Visualizer', tier: 'free' },
  NETWORK_GRAPH: { id: 'network_graph', name: 'Network Graph', tier: 'free' },
  BASIC_JARVIS: { id: 'basic_jarvis', name: 'Jarvis Assistant', tier: 'free' },
  MANDI_DETAILS: { id: 'mandi_details', name: 'Mandi Details', tier: 'free' },
  PRICE_HISTORY: { id: 'price_history', name: 'Price History (7 days)', tier: 'free' },
  
  // PREMIUM TIER FEATURES
  SURPLUS_DEFICIT: { id: 'surplus_deficit', name: 'Surplus/Deficit Intelligence', tier: 'premium' },
  TRANSFER_INTELLIGENCE: { id: 'transfer_intelligence', name: 'Transfer Intelligence', tier: 'premium' },
  FORECAST_ENGINE: { id: 'forecast_engine', name: 'Price Forecast Engine', tier: 'premium' },
  ADVANCED_ANALYTICS: { id: 'advanced_analytics', name: 'Advanced Analytics', tier: 'premium' },
  MARKET_UPDATE: { id: 'market_update', name: 'Market Update Panel', tier: 'premium' },
  FULL_HISTORY: { id: 'full_history', name: 'Full Historical Data', tier: 'premium' },
  COMMODITY_PANEL: { id: 'commodity_panel', name: 'Multi-Commodity Analysis', tier: 'premium' },
  ADVANCED_JARVIS: { id: 'advanced_jarvis', name: 'Advanced Jarvis Insights', tier: 'premium' },
};

// Premium benefits for upgrade modal
export const PREMIUM_BENEFITS = [
  {
    title: 'Surplus/Deficit Intelligence',
    description: 'Real-time supply-demand balance analysis with stabilization signals',
    icon: 'scale',
  },
  {
    title: 'Transfer Intelligence',
    description: 'AI-powered commodity redistribution recommendations',
    icon: 'truck',
  },
  {
    title: 'Price Forecast Engine',
    description: '7-30 day price predictions using advanced EMA models',
    icon: 'trending-up',
  },
  {
    title: 'Advanced Analytics',
    description: 'Deep market insights, multi-commodity analysis, and stress breakdown',
    icon: 'bar-chart',
  },
  {
    title: 'Market Update Panel',
    description: 'Direct operator input for real-time market signals',
    icon: 'edit',
  },
  {
    title: 'Full Historical Data',
    description: 'Access complete price and arrivals history for trend analysis',
    icon: 'history',
  },
];

// Tier hierarchy for comparison
const TIER_HIERARCHY = {
  free: 0,
  premium: 1,
};

// Load session from localStorage
const loadSession = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const session = JSON.parse(stored);
      // Validate session structure
      if (session && (session.tier === 'free' || session.tier === 'premium')) {
        return session;
      }
    }
  } catch (e) {
    console.warn('Failed to load session:', e);
  }
  return null;
};

// Save session to localStorage
const saveSession = (tier) => {
  try {
    const session = {
      tier,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('Failed to save session:', e);
  }
};

// Clear session from localStorage
const clearSession = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear session:', e);
  }
};

const TierContext = createContext(null);

export const TierProvider = ({ children }) => {
  // Initialize from stored session
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTier, setCurrentTier] = useState('free');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load session on mount
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setCurrentTier(session.tier);
      setIsAuthenticated(true);
    }
    setIsInitialized(true);
  }, []);

  // Login as Free Operator
  const loginAsFree = useCallback(() => {
    setCurrentTier('free');
    setIsAuthenticated(true);
    saveSession('free');
  }, []);

  // Login as Premium Operator
  const loginAsPremium = useCallback(() => {
    setCurrentTier('premium');
    setIsAuthenticated(true);
    saveSession('premium');
  }, []);

  // Logout
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentTier('free');
    clearSession();
    setShowUpgradeModal(false);
    setUpgradeFeature(null);
  }, []);

  // Check if a feature is accessible based on current tier
  const hasAccess = useCallback((feature) => {
    if (!feature) return true;
    const featureTierLevel = TIER_HIERARCHY[feature.tier] || 0;
    const userTierLevel = TIER_HIERARCHY[currentTier] || 0;
    return userTierLevel >= featureTierLevel;
  }, [currentTier]);

  // Check if a feature ID is accessible
  const hasFeatureAccess = useCallback((featureId) => {
    const feature = Object.values(FEATURES).find(f => f.id === featureId);
    return hasAccess(feature);
  }, [hasAccess]);

  // Toggle tier (for demo purposes)
  const toggleTier = useCallback(() => {
    const newTier = currentTier === 'free' ? 'premium' : 'free';
    setCurrentTier(newTier);
    saveSession(newTier);
  }, [currentTier]);

  // Set specific tier
  const setTier = useCallback((tier) => {
    if (tier === 'free' || tier === 'premium') {
      setCurrentTier(tier);
      saveSession(tier);
    }
  }, []);

  // Show upgrade prompt for a specific feature
  const promptUpgrade = useCallback((feature) => {
    setUpgradeFeature(feature);
    setShowUpgradeModal(true);
  }, []);

  // Close upgrade modal
  const closeUpgradeModal = useCallback(() => {
    setShowUpgradeModal(false);
    setUpgradeFeature(null);
  }, []);

  // Upgrade to premium (simulated)
  const upgradeToPremium = useCallback(() => {
    setCurrentTier('premium');
    saveSession('premium');
    setShowUpgradeModal(false);
    setUpgradeFeature(null);
  }, []);

  const value = {
    // Authentication state
    isAuthenticated,
    isInitialized,
    loginAsFree,
    loginAsPremium,
    logout,
    
    // Tier state
    currentTier,
    isPremium: currentTier === 'premium',
    isFree: currentTier === 'free',
    
    // Feature access
    hasAccess,
    hasFeatureAccess,
    toggleTier,
    setTier,
    
    // Upgrade modal
    promptUpgrade,
    closeUpgradeModal,
    upgradeToPremium,
    showUpgradeModal,
    upgradeFeature,
  };

  return (
    <TierContext.Provider value={value}>
      {children}
    </TierContext.Provider>
  );
};

export const useTier = () => {
  const context = useContext(TierContext);
  if (!context) {
    throw new Error('useTier must be used within a TierProvider');
  }
  return context;
};

export default TierContext;
