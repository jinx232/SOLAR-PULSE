import React, { createContext, useContext, useState, useEffect } from 'react';

const SolarContext = createContext(null);

const STORAGE_KEY_REC = 'sp_calculator_rec';
const STORAGE_KEY_ZONE = 'sp_solar_zone';

export function SolarProvider({ children }) {
  // 1. Geographic Location & Solar Irradiance
  const [region, setRegionRaw] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_ZONE);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.region || 'West Africa';
      }
    } catch (_) {}
    return 'West Africa';
  });

  const [sunHours, setSunHoursRaw] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_ZONE);
      if (saved) {
        const parsed = JSON.parse(saved);
        return typeof parsed.sunHours === 'number' ? parsed.sunHours : 5.4;
      }
    } catch (_) {}
    return 5.4;
  });

  const [zipCode, setZipCodeRaw] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_ZONE);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.zipCode || '101001';
      }
    } catch (_) {}
    return '101001';
  });

  // Sync geographic parameters to sessionStorage
  const setRegion = (val) => {
    setRegionRaw(val);
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY_ZONE) || '{}');
      sessionStorage.setItem(STORAGE_KEY_ZONE, JSON.stringify({ ...saved, region: val }));
    } catch (_) {}
  };

  const setSunHours = (val) => {
    setSunHoursRaw(val);
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY_ZONE) || '{}');
      sessionStorage.setItem(STORAGE_KEY_ZONE, JSON.stringify({ ...saved, sunHours: val }));
    } catch (_) {}
  };

  const setZipCode = (val) => {
    setZipCodeRaw(val);
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY_ZONE) || '{}');
      sessionStorage.setItem(STORAGE_KEY_ZONE, JSON.stringify({ ...saved, zipCode: val }));
    } catch (_) {}
  };

  // 2. Calculator Recommendation (with Priority 3: SessionStorage persistence)
  const [calculatorRecommendation, setCalculatorRecommendationRaw] = useState(() => {
    try {
      const cached = sessionStorage.getItem(STORAGE_KEY_REC);
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return null;
  });

  const setRecommendation = (rec) => {
    setCalculatorRecommendationRaw(rec);
    try {
      if (rec) {
        sessionStorage.setItem(STORAGE_KEY_REC, JSON.stringify(rec));
      } else {
        sessionStorage.removeItem(STORAGE_KEY_REC);
      }
    } catch (_) {}
  };

  const clearRecommendation = () => {
    setRecommendation(null);
  };

  const value = {
    region,
    setRegion,
    sunHours,
    setSunHours,
    zipCode,
    setZipCode,
    recommendation: calculatorRecommendation,
    setRecommendation,
    clearRecommendation,
  };

  return (
    <SolarContext.Provider value={value}>
      {children}
    </SolarContext.Provider>
  );
}

export function useSolar() {
  const context = useContext(SolarContext);
  if (!context) {
    throw new Error('useSolar must be used within a SolarProvider');
  }
  return context;
}
