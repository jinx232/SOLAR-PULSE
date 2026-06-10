import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Wind, 
  Lightbulb, 
  Layers, 
  ArrowRight, 
  HelpCircle, 
  TrendingUp,
  RotateCcw,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Battery,
  AlertCircle,
  Play,
  Square,
  Activity,
  Compass,
  Plus,
  Trash2
} from 'lucide-react';

const initialAppliances = [
  // Kitchen
  { id: 1, name: 'Refrigerator', category: 'Kitchen', watts: 150, hours: 24, qty: 1, icon: 'kitchen', isCritical: true },
  { id: 2, name: 'Microwave', category: 'Kitchen', watts: 1200, hours: 0.5, qty: 1, icon: 'kitchen', isCritical: false },
  { id: 3, name: 'Dishwasher', category: 'Kitchen', watts: 1200, hours: 1, qty: 1, icon: 'kitchen', isCritical: false },
  // HVAC
  { id: 4, name: 'Air Conditioner', category: 'HVAC', watts: 1500, hours: 6, qty: 1, icon: 'hvac', isCritical: false },
  { id: 5, name: 'Space Heater', category: 'HVAC', watts: 1500, hours: 0, qty: 1, icon: 'hvac', isCritical: false },
  // Lighting & Entertainment
  { id: 6, name: 'LED Bulbs', category: 'Lights', watts: 10, hours: 6, qty: 10, icon: 'lights', isCritical: true },
  { id: 7, name: 'Television & Console', category: 'Entertainment', watts: 120, hours: 4, qty: 2, icon: 'entertainment', isCritical: false },
  { id: 8, name: 'Laptops / Chargers', category: 'Entertainment', watts: 65, hours: 8, qty: 3, icon: 'entertainment', isCritical: true },
  // Laundry / Heavy Duty
  { id: 9, name: 'Washing Machine', category: 'Laundry', watts: 500, hours: 1, qty: 1, icon: 'laundry', isCritical: false },
  { id: 10, name: 'Clothes Dryer', category: 'Laundry', watts: 3000, hours: 0.5, qty: 1, icon: 'laundry', isCritical: false },
];

export default function Calculator({ 
  setActiveView, 
  setRecommendation,
  region,
  setRegion,
  sunHours,
  setSunHours,
  zipCode,
  setZipCode
}) {
  const [appliances, setAppliances] = useState(initialAppliances);
  const [gridRate, setGridRate] = useState(0.16); // $ per kWh
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppWatts, setNewAppWatts] = useState(200);
  const [nextId, setNextId] = useState(initialAppliances.length + 1);
  
  // Grid Outage Simulator states
  const [isOutageActive, setIsOutageActive] = useState(false);
  const [batterySoc, setBatterySoc] = useState(100);

  // Toggle appliance parameters
  const updateAppliance = (id, field, value) => {
    setAppliances(prev => prev.map(app => {
      if (app.id === id) {
        return { ...app, [field]: value };
      }
      return app;
    }));
  };

  // Toggle critical status
  const toggleCritical = (id) => {
    setAppliances(prev => prev.map(app => {
      if (app.id === id) {
        return { ...app, isCritical: !app.isCritical };
      }
      return app;
    }));
  };

  // Reset to default
  const resetToDefault = () => {
    setAppliances(initialAppliances);
    setNextId(initialAppliances.length + 1);
    setIsOutageActive(false);
    setBatterySoc(100);
    setRegion('Southwest');
    setSunHours(5.8);
    setZipCode('90210');
    setShowAddForm(false);
  };

  // Add custom appliance
  const handleAddAppliance = () => {
    if (!newAppName.trim() || newAppWatts <= 0) return;
    const newAppliance = {
      id: nextId,
      name: newAppName.trim(),
      category: 'Custom',
      watts: newAppWatts,
      hours: 4,
      qty: 1,
      icon: 'custom',
      isCritical: false
    };
    setAppliances(prev => [...prev, newAppliance]);
    setNextId(prev => prev + 1);
    setNewAppName('');
    setNewAppWatts(200);
    setShowAddForm(false);
  };

  // Delete appliance
  const deleteAppliance = (id) => {
    setAppliances(prev => prev.filter(app => app.id !== id));
  };

  // Calculations
  const calculateKwh = (app) => {
    return (app.watts * app.hours * app.qty) / 1000;
  };

  // Totals
  const totalDailyKwh = appliances.reduce((sum, app) => sum + calculateKwh(app), 0);
  const totalMonthlyKwh = totalDailyKwh * 30.4;
  const totalMonthlyCost = totalMonthlyKwh * gridRate;

  // Solar sizing calculations using dynamic shared sunHours
  const systemEfficiencyFactor = 0.8;
  const recommendedSystemSizeKw = totalDailyKwh > 0 
    ? Math.round((totalDailyKwh / sunHours / systemEfficiencyFactor) * 10) / 10 
    : 0;

  const panelWattage = 400; 
  const recommendedPanelCount = recommendedSystemSizeKw > 0 
    ? Math.ceil((recommendedSystemSizeKw * 1000) / panelWattage) 
    : 0;

  // Categories aggregation
  const categories = ['Kitchen', 'HVAC', 'Lights', 'Entertainment', 'Laundry'];
  const categoryTotals = categories.map(cat => {
    const total = appliances
      .filter(app => app.category === cat)
      .reduce((sum, app) => sum + calculateKwh(app), 0);
    return { name: cat, kwh: Math.round(total * 100) / 100 };
  });

  const grandTotalKwh = categoryTotals.reduce((sum, cat) => sum + cat.kwh, 0);

  // --- Outage & Sizer Sizing Calculations ---
  // Critical active running load (Watts) currently turned on (hours > 0)
  const activeCriticalWatts = appliances
    .filter(app => app.isCritical && app.hours > 0)
    .reduce((sum, app) => sum + (app.watts * app.qty), 0);

  // Non-critical active running load (Watts) currently turned on (hours > 0)
  const activeNonCriticalWatts = appliances
    .filter(app => !app.isCritical && app.hours > 0)
    .reduce((sum, app) => sum + (app.watts * app.qty), 0);

  // Total active draw in the house (Watts)
  const totalRunningWatts = activeCriticalWatts + activeNonCriticalWatts;

  // Total outage active draw (Watts)
  const simulatedOutageWatts = totalRunningWatts;

  // Sizing Recommended Battery Capacity (kWh)
  // Assumes we want to support daily critical hours usage for a standard 18-hour outage
  const dailyCriticalKwh = appliances
    .filter(app => app.isCritical)
    .reduce((sum, app) => sum + calculateKwh(app), 0);
  
  // Recommends battery size with a 25% safety buffer
  const recommendedBatteryKwh = dailyCriticalKwh > 0
    ? Math.round((dailyCriticalKwh * 0.75 * 1.25) * 10) / 10
    : 0;

  // Recommended battery system type
  let recommendedBatterySystem = 'None Required';
  let batteryCapacityKwh = 13.5; // standard capacity in kWh for calculations
  if (recommendedBatteryKwh > 0 && recommendedBatteryKwh <= 6.0) {
    recommendedBatterySystem = 'Enphase 5P (5.0 kWh)';
    batteryCapacityKwh = 5.0;
  } else if (recommendedBatteryKwh > 6.0 && recommendedBatteryKwh <= 15.0) {
    recommendedBatterySystem = 'Tesla Powerwall 3 (13.5 kWh)';
    batteryCapacityKwh = 13.5;
  } else if (recommendedBatteryKwh > 15.0 && recommendedBatteryKwh <= 30.0) {
    recommendedBatterySystem = '2x Tesla Powerwall 3 (27.0 kWh)';
    batteryCapacityKwh = 27.0;
  } else if (recommendedBatteryKwh > 30.0) {
    recommendedBatterySystem = 'Whole-Home Storage (40.5+ kWh)';
    batteryCapacityKwh = 40.5;
  }

  // Backup Lifeline Duration in Hours
  const availableKwh = batteryCapacityKwh * (batterySoc / 100);
  const estimatedBackupHours = simulatedOutageWatts > 0
    ? Math.round((availableKwh / (simulatedOutageWatts / 1000)) * 10) / 10
    : 99.9; // virtually infinite standby

  // Warning state: user runs high-draw non-critical appliances during outage
  const hasActiveNonCriticalWarning = isOutageActive && activeNonCriticalWatts > 0;

  // Outage live drain simulator effect
  useEffect(() => {
    let interval = null;
    if (isOutageActive && batterySoc > 0) {
      interval = setInterval(() => {
        setBatterySoc(prev => {
          const loadKw = simulatedOutageWatts / 1000;
          const drainRate = loadKw > 0 ? Math.max(0.4, loadKw * 1.2) : 0;
          const nextSoc = Math.max(0, Math.round((prev - drainRate) * 10) / 10);
          return nextSoc;
        });
      }, 1000);
    } else if (batterySoc === 0 && isOutageActive) {
      setIsOutageActive(false);
    }
    return () => clearInterval(interval);
  }, [isOutageActive, batterySoc, simulatedOutageWatts]);

  // Handle offline ZIP code parsing
  useEffect(() => {
    const cleanZip = zipCode.trim();
    if (/^\d{5}$/.test(cleanZip)) {
      const firstDigit = cleanZip.charAt(0);
      let matchedRegion = 'Midwest';
      let matchedHours = 4.5;

      switch (firstDigit) {
        case '0':
        case '1':
        case '2':
          matchedRegion = 'Northeast';
          matchedHours = 3.8;
          break;
        case '3':
        case '7':
          matchedRegion = 'Southeast';
          matchedHours = 5.2;
          break;
        case '8':
        case '9':
          matchedRegion = 'Southwest';
          matchedHours = 6.0;
          break;
        case '4':
        case '5':
        case '6':
        default:
          matchedRegion = 'Midwest';
          matchedHours = 4.5;
          break;
      }

      setRegion(matchedRegion);
      setSunHours(matchedHours);
    }
  }, [zipCode]);

  // Handle manual region selection dropdown changes
  const handleRegionChange = (selectedRegion) => {
    setRegion(selectedRegion);
    let matchedHours = 4.5;
    let sampleZip = '60601';

    switch (selectedRegion) {
      case 'Southwest':
        matchedHours = 6.0;
        sampleZip = '90210';
        break;
      case 'Southeast':
        matchedHours = 5.2;
        sampleZip = '30301';
        break;
      case 'Midwest':
        matchedHours = 4.5;
        sampleZip = '60601';
        break;
      case 'Northeast':
        matchedHours = 3.8;
        sampleZip = '10001';
        break;
      case 'Pacific Northwest':
        matchedHours = 3.2;
        sampleZip = '98101';
        break;
      default:
        matchedHours = 4.5;
    }
    setSunHours(matchedHours);
    setZipCode(sampleZip); 
  };

  // Trigger Cost Estimator with Recommendation
  const handleProceedToEstimator = () => {
    if (recommendedSystemSizeKw > 0) {
      setRecommendation({
        systemSizeKw: recommendedSystemSizeKw,
        panelCount: recommendedPanelCount,
        monthlyBill: totalMonthlyCost
      });
      setActiveView('estimator');
    }
  };

  // Color mappings
  const categoryColors = {
    Kitchen: '#eab308', 
    HVAC: '#f43f5e', 
    Lights: '#10b981', 
    Entertainment: '#3b82f6', 
    Laundry: '#8b5cf6' 
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Title banner */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Appliance Solar & Battery Backup Workstation</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Identify your home's exact energy footprint, configure critical emergency backup loads, and size custom storage for grid reliability.</p>
      </div>

      {/* Live Outage Simulation Announcement Banner */}
      {isOutageActive && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '12px',
          fontSize: '0.95rem',
          color: '#f43f5e',
          animation: 'pulseGlow 2s infinite'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={18} className="logo-icon" style={{ color: '#f43f5e' }} />
            <span><strong>GRID BLACKOUT ACTIVE</strong>: Main power utility offline. The home is now running on backup battery reserves!</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f43f5e', fontWeight: 'bold' }}>
            <span>Outage Load: {simulatedOutageWatts} W</span>
          </div>
        </div>
      )}

      <div className="grid-cols-3">
        
        {/* Sliders Input Workstation */}
        <div className="premium-card grid-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Active Household Appliances</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-outline"
                onClick={() => setShowAddForm(prev => !prev)}
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                aria-label="Add custom appliance"
              >
                <Plus size={14} /> Add Appliance
              </button>
              <button className="btn-outline" onClick={resetToDefault} style={{ padding: '8px 14px', fontSize: '0.85rem' }} aria-label="Reset to defaults">
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          </div>

          {/* Add Appliance Form */}
          {showAddForm && (
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '12px',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <strong style={{ fontSize: '0.9rem', color: 'hsl(var(--color-solar))' }}>+ New Custom Appliance</strong>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Appliance name (e.g. Pool Pump)"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="form-input"
                  style={{ flex: 2, minWidth: '150px', padding: '8px 12px', fontSize: '0.85rem' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '120px' }}>
                  <input
                    type="number"
                    placeholder="Watts"
                    value={newAppWatts}
                    min={1}
                    max={10000}
                    onChange={(e) => setNewAppWatts(parseInt(e.target.value) || 0)}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>W</span>
                </div>
                <button
                  className="btn-primary"
                  onClick={handleAddAppliance}
                  disabled={!newAppName.trim() || newAppWatts <= 0}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          )}

          {/* Table list of appliances */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
            {appliances.map(app => {
              const currentKwh = Math.round(calculateKwh(app) * 100) / 100;
              return (
                <div key={app.id} style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '12px',
                  border: app.isCritical ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)',
                  boxShadow: app.isCritical ? '0 0 10px rgba(16, 185, 129, 0.05)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative',
                  transition: 'all var(--transition-fast)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: categoryColors[app.category]
                      }}></span>
                      <strong style={{ fontSize: '0.95rem' }}>{app.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '99px' }}>
                        {app.category}
                      </span>
                    </div>
                    
                    {/* Critical Load Shield Toggle Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {currentKwh} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>kWh/day</span>
                      </span>
                      <button 
                        onClick={() => toggleCritical(app.id)}
                        title={`Mark as ${app.isCritical ? 'Non-Critical' : 'Backup Critical'} Load`}
                        aria-label={`Toggle critical status for ${app.name}`}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: app.isCritical ? 'hsl(var(--color-gen))' : 'var(--text-muted)',
                          padding: '4px',
                          borderRadius: '6px',
                          backgroundColor: app.isCritical ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        {app.isCritical ? <ShieldCheck size={20} /> : <Shield size={20} />}
                      </button>
                      {/* Delete button for custom appliances or to remove any appliance */}
                      <button
                        onClick={() => deleteAppliance(app.id)}
                        title={`Remove ${app.name}`}
                        aria-label={`Delete ${app.name}`}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          padding: '4px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all var(--transition-fast)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Range Sliders Group */}
                  <div className="grid-cols-3" style={{ gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>
                        <span>Quantity</span>
                        <span>{app.qty}</span>
                      </label>
                      <input 
                        type="range" 
                        min="1" 
                        max="15" 
                        value={app.qty} 
                        onChange={(e) => updateAppliance(app.id, 'qty', parseInt(e.target.value))} 
                        style={{ height: '4px', margin: '4px 0' }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>
                        <span>Power (Watts)</span>
                        <span>{app.watts} W</span>
                      </label>
                      <input 
                        type="range" 
                        min="5" 
                        max="3500" 
                        step="5"
                        value={app.watts} 
                        onChange={(e) => updateAppliance(app.id, 'watts', parseInt(e.target.value))} 
                        style={{ height: '4px', margin: '4px 0' }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>
                        <span>Hours Used / Day</span>
                        <span>{app.hours} h</span>
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="24" 
                        step="0.5"
                        value={app.hours} 
                        onChange={(e) => updateAppliance(app.id, 'hours', parseFloat(e.target.value))} 
                        style={{ height: '4px', margin: '4px 0' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time recommendations & SVG Category breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* GEOGRAPHIC PRESETS CARD */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={18} style={{ color: 'hsl(var(--color-solar))' }} />
              Geographic Sizing Zone
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">
                  <span>Target US Region</span>
                  <span style={{ color: 'hsl(var(--color-solar))', fontWeight: 'bold' }}>{sunHours} peak hrs</span>
                </label>
                <select
                  value={region}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                >
                  <option value="Southwest">Southwest US (Desert/Sun — 6.0h)</option>
                  <option value="Southeast">Southeast US (Sunny/Humid — 5.2h)</option>
                  <option value="Midwest">Midwest US (Standard — 4.5h)</option>
                  <option value="Northeast">Northeast US (Moderate — 3.8h)</option>
                  <option value="Pacific Northwest">Pacific Northwest (Cloudy — 3.2h)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>US ZIP Code Sizer</span>
                  <span style={{ color: 'var(--text-muted)' }}>offline auto-match</span>
                </label>
                <input
                  type="text"
                  maxLength="5"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 90210"
                  className="form-input"
                  style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Summary Metric Statement Card */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Consumption Ledger</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', pb: '8px', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Daily Consumption</span>
                <span style={{ fontWeight: 700 }}>{Math.round(totalDailyKwh * 100) / 100} kWh</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', pb: '8px', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Monthly Consumption</span>
                <span style={{ fontWeight: 700 }}>{Math.round(totalMonthlyKwh * 10) / 10} kWh</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', pb: '8px', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Current Utility Rate</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>$</span>
                  <input 
                    type="number" 
                    value={gridRate}
                    onChange={(e) => setGridRate(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    style={{ width: '60px', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', textAlign: 'right', fontSize: '0.85rem' }} 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 'bold', color: 'hsl(var(--color-con))' }}>
                <span>Estimated Monthly Bill</span>
                <span>${Math.round(totalMonthlyCost).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Interactive SVG Category breakdown Card */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Category Breakdown</h3>
            
            {grandTotalKwh > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Horizontal custom breakdown chart bars */}
                <div style={{ display: 'flex', height: '14px', width: '100%', borderRadius: '99px', overflow: 'hidden', backgroundColor: 'var(--border-color)' }}>
                  {categoryTotals.map(cat => {
                    const percentage = grandTotalKwh > 0 ? (cat.kwh / grandTotalKwh) * 100 : 0;
                    if (percentage === 0) return null;
                    return (
                      <div 
                        key={cat.name}
                        style={{ 
                          width: `${percentage}%`, 
                          backgroundColor: categoryColors[cat.name], 
                          transition: 'width var(--transition-normal)' 
                        }}
                        title={`${cat.name}: ${cat.kwh} kWh (${Math.round(percentage)}%)`}
                      />
                    );
                  })}
                </div>

                {/* Legends and percentages list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {categoryTotals.map(cat => {
                    const percentage = grandTotalKwh > 0 ? (cat.kwh / grandTotalKwh) * 100 : 0;
                    return (
                      <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: categoryColors[cat.name] }}></span>
                          <span style={{ color: 'var(--text-secondary)' }}>{cat.name}</span>
                        </div>
                        <span style={{ fontWeight: 600 }}>
                          {cat.kwh} kWh <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 400 }}>({Math.round(percentage)}%)</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ textAlignment: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                All appliance loads are set to zero. Increase usage hours to generate breakdowns!
              </div>
            )}
          </div>

          {/* GRID OUTAGE SIMULATOR CARD */}
          <div className="premium-card" style={{
            backgroundImage: isOutageActive ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(249, 115, 22, 0.08) 100%)' : 'none',
            border: isOutageActive ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            transition: 'all var(--transition-normal)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Battery size={20} style={{ color: isOutageActive ? '#f43f5e' : 'hsl(var(--color-bat))' }} />
                Outage & Storage Sizer
              </h3>
              {isOutageActive && (
                <span className="logo-icon" style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 700, backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '99px' }}>
                  Sim Active
                </span>
              )}
            </div>

            {/* Recommended battery capacity statement */}
            {!isOutageActive ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Sizes backing storage based on your configured <strong>Backup Critical</strong> appliances.
                </p>
                <div style={{
                  padding: '12px',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Critical Load:</span>
                    <strong>{appliances.filter(app => app.isCritical).length} appliances</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Recommended Size:</span>
                    <strong style={{ color: 'hsl(var(--color-bat))' }}>{recommendedBatteryKwh} kWh</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '2px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>System Pick:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{recommendedBatterySystem}</strong>
                  </div>
                </div>

                <button 
                  className="btn-primary" 
                  disabled={totalDailyKwh === 0}
                  onClick={() => {
                    setBatterySoc(100);
                    setIsOutageActive(true);
                  }}
                  style={{ 
                    width: '100%', 
                    fontSize: '0.85rem', 
                    padding: '10px 16px',
                    backgroundColor: '#f43f5e',
                    boxShadow: '0 4px 14px 0 rgba(244, 63, 94, 0.3)'
                  }}
                >
                  <Play size={16} /> Simulate Grid Outage
                </button>
              </div>
            ) : (
              // Live Simulation workstation controls
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
                
                {/* SVG Visualizer Battery depleting */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  padding: '12px',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)'
                }}>
                  <svg viewBox="0 0 100 40" style={{ width: '90px', height: '36px', overflow: 'visible' }}>
                    <rect x="5" y="5" width="80" height="30" rx="6" fill="none" stroke="var(--text-secondary)" strokeWidth="3" />
                    <rect x="85" y="12" width="6" height="16" rx="2.5" fill="var(--text-secondary)" />
                    <rect 
                      x="9" 
                      y="9" 
                      width={Math.round(batterySoc * 0.72)} 
                      height="22" 
                      rx="3.5" 
                      fill={batterySoc > 20 ? 'hsl(var(--color-gen))' : '#f43f5e'} 
                      style={{ transition: 'width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' }} 
                    />
                  </svg>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: batterySoc > 20 ? 'hsl(var(--color-gen))' : '#f43f5e' }}>
                      {batterySoc}%
                    </h2>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Backup Charge</span>
                  </div>
                </div>

                {/* Simulated Outage Statistics */}
                <div style={{
                  padding: '12px',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Active Backup Draw:</span>
                    <strong>{simulatedOutageWatts} W</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '2px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Estimated Lifeline:</span>
                    <strong style={{ color: batterySoc > 20 ? 'hsl(var(--color-gen))' : '#f43f5e', fontSize: '0.95rem' }}>
                      {estimatedBackupHours === 99.9 ? 'Infinite' : `${estimatedBackupHours} hours`}
                    </strong>
                  </div>
                </div>

                {/* Overload Warning Banner if Non-critical active */}
                {hasActiveNonCriticalWarning && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: 'rgba(249, 115, 22, 0.08)',
                    border: '1px solid rgba(249, 115, 22, 0.25)',
                    borderRadius: '8px',
                    color: '#d97706',
                    fontSize: '0.78rem',
                    lineHeight: '1.4',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                      <ShieldAlert size={14} />
                      <span>Backup Overload Warning!</span>
                    </div>
                    <p>
                      Non-critical appliances (e.g. A/C, Dryer) are actively running. Turn them off or toggle their critical shields to extend battery backup duration!
                    </p>
                  </div>
                )}

                {/* Control Action Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="btn-outline" 
                    onClick={() => setBatterySoc(100)}
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                  >
                    Recharge Battery
                  </button>
                  <button 
                    className="btn-outline" 
                    onClick={() => setIsOutageActive(false)}
                    style={{ 
                      flex: 1, 
                      padding: '8px 12px', 
                      fontSize: '0.8rem',
                      borderColor: '#f43f5e',
                      color: '#f43f5e'
                    }}
                  >
                    <Square size={12} /> Stop Outage
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Smart Solar Recommendation Card */}
          {recommendedSystemSizeKw > 0 && (
            <div className="premium-card animate-float" style={{
              backgroundImage: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'hsl(var(--color-solar))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🎯 Smart Solar Recommendation
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Based on your daily load of **{Math.round(totalDailyKwh * 100) / 100} kWh**, your property is ideal for solar transformation.
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', py: '8px', padding: '8px 0', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>RECOMMENDED SIZE</span>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{recommendedSystemSizeKw} kW</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>400W PANEL COUNT</span>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{recommendedPanelCount} Panels</span>
                </div>
              </div>

              <button className="btn-primary" onClick={handleProceedToEstimator} style={{ width: '100%', fontSize: '0.85rem', padding: '10px 16px' }}>
                Estimate System ROI <ArrowRight size={16} />
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
