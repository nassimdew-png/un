import React, { createContext, useContext, useState, useEffect } from 'react';
import { featureFlagsApi } from '../api';

const FeatureFlagsContext = createContext({
  features: {},
  loading: true,
  isFeatureEnabled: () => true,
  refreshFlags: () => {},
});

export function FeatureFlagsProvider({ children }) {
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);

  const loadFlags = async () => {
    try {
      const res = await featureFlagsApi.getPublicFlags();
      if (res.success && res.features) {
        setFeatures(res.features);
      }
    } catch (err) {
      console.warn('Failed to load public feature flags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const isFeatureEnabled = (key) => {
    if (features[key] === undefined) return true; // default enabled
    return Boolean(features[key]);
  };

  return (
    <FeatureFlagsContext.Provider value={{ features, loading, isFeatureEnabled, refreshFlags: loadFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export const useFeatureFlags = () => useContext(FeatureFlagsContext);
