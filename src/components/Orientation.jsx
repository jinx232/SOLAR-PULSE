import React, { useState } from 'react';
import { 
  Compass, 
  Info, 
  HelpCircle, 
  CheckCircle2, 
  Sun, 
  Layers, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { searchPostalCode } from '../utils/postalLookup';

const panelTypes = [
  {
    name: 'Monocrystalline',
    recommended: true,
    efficiency: '19% - 22%',
    lifespan: '25 - 30+ Years',
    tempCoeff: '-0.35% / °C (Best)',
    relativeCost: 'Premium',
    bestSuited: 'Residential roofs with limited space or high efficiency aesthetic preferences.',
    pros: ['Highest power output', 'Sleek dark look', 'Space efficient'],
    cons: ['Highest upfront price tag']
  },
  {
    name: 'Polycrystalline',
    recommended: false,
    efficiency: '15% - 17%',
    lifespan: '20 - 25 Years',
    tempCoeff: '-0.40% / °C',
    relativeCost: 'Moderate',
    bestSuited: 'Larger ground-mounted arrays or flat roofs where space is cheap.',
    pros: ['Budget-friendly pricing', 'Less waste in manufacturing'],
    cons: ['Lower efficiency requires more space', 'Speckled blue look']
  },
  {
    name: 'Thin Film (Amorphous)',
    recommended: false,
    efficiency: '11% - 13%',
    lifespan: '15 - 20 Years',
    tempCoeff: '-0.20% / °C',
    relativeCost: 'Economical',
    bestSuited: 'Commercial buildings, curved RV roofs, or flexible shingle overlays.',
    pros: ['Extremely flexible & thin', 'Lightweight', 'Performs best in hot desert regions'],
    cons: ['Degrades faster', 'Extremely low power density requires massive spaces']
  }
];

export default function Orientation() {
  const [activePanelType, setActivePanelType] = useState('Monocrystalline');
  const [tilt, setTilt] = useState(30); // tilt angle in degrees
  const [azimuth, setAzimuth] = useState('South'); // Compass orientation
  const [postalQuery, setPostalQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Calculations for solar capture efficiency based on physics defaults
  // In the Northern Hemisphere, South orientation at ~35° tilt yields 100% capture.
  const calculateCaptureEfficiency = () => {
    let azimuthFactor = 1.0;
    
    // Directional modifiers
    switch (azimuth) {
      case 'South':
        azimuthFactor = 1.0;
        break;
      case 'West':
      case 'East':
        azimuthFactor = 0.82;
        break;
      case 'North':
        azimuthFactor = 0.45;
        break;
      default:
        azimuthFactor = 1.0;
    }

    // Optimal tilt for average mid-latitudes is 30-40 degrees.
    // Let's model deviation from optimal 35 degrees.
    const tiltDeviation = Math.abs(tilt - 35);
    const tiltFactor = Math.max(0.7, 1 - (tiltDeviation * 0.005));

    const finalEfficiency = Math.round(azimuthFactor * tiltFactor * 100);
    return Math.min(100, Math.max(25, finalEfficiency));
  };

  const captureEfficiency = calculateCaptureEfficiency();

  // Text descriptions based on combinations
  const getAdvisoryText = () => {
    if (azimuth === 'South' && tilt >= 25 && tilt <= 45) {
      return "🏆 **Perfect Sizing Orientation**: Facing true South at a standard slope maximizes year-round sunshine index. No production adjustments needed!";
    }
    if (azimuth === 'North') {
      return "⚠️ **Production Warning**: Facing North directs panels away from primary solar paths (in the Northern Hemisphere), reducing capture by over **50%**. Consider ground mounts or a flat layout!";
    }
    if (azimuth === 'West' || azimuth === 'East') {
      return "ℹ️ **Moderate Solar Capture**: East/West facing panels generate ~18% less than South, but they are great for morning (East) or late-afternoon (West) peak grid rate demands.";
    }
    return "💡 **Slope Tuning**: Adjusting panel slope closer to 35° will align panels perpendicularly to solar rays, capturing more energy.";
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Panel Matrix & Orientation Tuning</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Compare solar panel tech classes side-by-side, then adjust tilts and compass angles to calculate geographic capture index.</p>
      </div>

      {/* Panel Type Comparisons */}
      <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Solar Cell Classifications</h3>
        
        {/* Chips row to toggle */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', pb: '12px', paddingBottom: '12px' }}>
          {panelTypes.map(panel => (
            <button
              key={panel.name}
              className={`btn-outline ${activePanelType === panel.name ? 'active' : ''}`}
              onClick={() => setActivePanelType(panel.name)}
              style={{
                borderColor: activePanelType === panel.name ? 'hsl(var(--color-solar))' : 'var(--border-color)',
                color: activePanelType === panel.name ? 'white' : 'var(--text-primary)',
                backgroundColor: activePanelType === panel.name ? 'hsl(var(--color-solar))' : 'transparent',
                padding: '8px 20px',
                fontSize: '0.9rem',
                borderRadius: '99px'
              }}
            >
              {panel.name} {panel.recommended && '⭐'}
            </button>
          ))}
        </div>

        {/* Selected Panel Detail Grid */}
        {panelTypes.filter(p => p.name === activePanelType).map(panel => (
          <div key={panel.name} className="grid-cols-3" style={{ gap: '32px' }}>
            
            {/* Specs card */}
            <div className="grid-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{panel.name} Technology</h4>
                {panel.recommended && (
                  <span style={{ fontSize: '0.75rem', color: '#059669', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 10px', borderRadius: '99px', fontWeight: 700 }}>
                    Recommended Class
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {panel.bestSuited}
              </p>

              {/* Pros/Cons list */}
              <div className="grid-cols-2" style={{ marginTop: '12px' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'hsl(var(--color-gen))', display: 'block', mb: '6px', marginBottom: '6px' }}>Advantages:</strong>
                  {panel.pros.map((pro, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <CheckCircle2 size={14} style={{ color: 'hsl(var(--color-gen))', flexShrink: 0 }} />
                      <span>{pro}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'hsl(var(--color-con))', display: 'block', mb: '6px', marginBottom: '6px' }}>Disadvantages:</strong>
                  {panel.cons.map((con, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span style={{ color: 'hsl(var(--color-con))', fontWeight: 'bold', fontSize: '1.2rem', lineHeight: 1 }}>•</span>
                      <span>{con}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Ledger card */}
            <div style={{
              padding: '20px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontSize: '0.9rem'
            }}>
              <strong style={{ fontSize: '0.95rem', borderBottom: '1px solid var(--border-color)', pb: '8px', paddingBottom: '8px' }}>Technical Parameters</strong>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Efficiency</span>
                <strong>{panel.efficiency}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Lifespan</span>
                <strong>{panel.lifespan}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Temp Coeff</span>
                <strong>{panel.tempCoeff}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Capital Tier</span>
                <strong style={{ color: 'hsl(var(--color-solar))' }}>{panel.relativeCost}</strong>
              </div>
            </div>

          </div>
        ))}

      </div>

      {/* Compass Orientation Angle Sizer Tool */}
      <div className="grid-cols-3">
        
        {/* Sliders Input Panel */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={20} style={{ color: 'hsl(var(--color-solar))' }} />
            Orientation Sizer
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Azimuth Buttons Selector */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>
                <span>Roof Compass Direction</span>
                <span className="value" style={{ fontWeight: 700 }}>{azimuth}</span>
              </label>
              
              <div className="grid-cols-2" style={{ gap: '8px' }}>
                {['South', 'West', 'East', 'North'].map(dir => (
                  <button
                    key={dir}
                    onClick={() => setAzimuth(dir)}
                    className="btn-outline"
                    style={{
                      padding: '10px',
                      fontSize: '0.85rem',
                      borderRadius: '8px',
                      borderColor: azimuth === dir ? 'hsl(var(--color-solar))' : 'var(--border-color)',
                      backgroundColor: azimuth === dir ? 'var(--color-solar-glow)' : 'transparent',
                      color: azimuth === dir ? 'hsl(var(--color-solar))' : 'var(--text-primary)'
                    }}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>

            {/* Roof Tilt Slider */}
            <div className="form-group">
              <label className="form-label">
                <span>Roof Tilt Angle</span>
                <span className="value">{tilt}°</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="60" 
                value={tilt} 
                onChange={(e) => setTilt(parseInt(e.target.value))} 
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {tilt === 0 ? 'Flat Layout (Requires minimal brackets)' : tilt === 35 ? 'Perfect geographic slope!' : 'Standard structural slope'}
              </span>
            </div>

            {/* Postal Code / Location Lookup */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Postal Code / Place</span>
                <span className="value" style={{ fontSize: '0.85rem' }}>{selectedLocation ? (selectedLocation.display_name.split(',')[0]) : 'Online lookup'}</span>
              </label>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="search"
                  placeholder="Enter postal code, city or address"
                  value={postalQuery}
                  onChange={(e) => setPostalQuery(e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
                <button
                  onClick={async () => {
                    if (!postalQuery) return;
                    setLookupLoading(true);
                    setLookupError(null);
                    try {
                      const results = await searchPostalCode(postalQuery);
                      setSuggestions(results);
                    } catch (err) {
                      setLookupError(err.message || 'Lookup failed. Internet connection required.');
                    } finally {
                      setLookupLoading(false);
                    }
                  }}
                  className="btn-primary"
                  style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                  aria-label="Search for location"
                >
                  {lookupLoading ? 'Searching...' : 'Search'}
                </button>
              </div>

              {lookupError && <div style={{ color: 'var(--color-con)', marginTop: '8px' }}>{lookupError}</div>}

              {suggestions && suggestions.length > 0 && (
                <div style={{ marginTop: '8px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', maxHeight: '180px', overflow: 'auto' }}>
                  {suggestions.map((s, idx) => (
                    <button key={idx} onClick={() => {
                      setSelectedLocation(s);
                      // Recommend tilt ~ |latitude| clamped to 0-60
                      const lat = s.lat || 0;
                      const newTilt = Math.min(60, Math.max(0, Math.round(Math.abs(lat))));
                      setTilt(newTilt);
                      setAzimuth(lat < 0 ? 'North' : 'South');
                      setPostalQuery(s.display_name);
                      setSuggestions([]);
                    }} className="btn-ghost" style={{ display: 'block', textAlign: 'left', width: '100%', padding: '8px 12px', border: 'none', background: 'transparent' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{s.display_name.split(',')[0]}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.display_name}</div>
                    </button>
                  ))}
                </div>
              )}

              {selectedLocation && (
                <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Selected: {selectedLocation.display_name} • Lat: {selectedLocation.lat.toFixed(4)}, Lon: {selectedLocation.lon.toFixed(4)}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Dynamic Graphic SVG Panel */}
        <div className="premium-card grid-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Irradiance Capture Visualizer</h3>
          
          <div className="grid-cols-2" style={{ gap: '24px', alignItems: 'center' }}>
            
            {/* Live SVG Vector Sizer */}
            <div style={{ position: 'relative', width: '100%', height: '220px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', overflow: 'hidden' }}>
              <svg viewBox="0 0 200 150" style={{ width: '100%', height: '100%' }}>
                
                {/* Simulated Horizon Ground line */}
                <line x1="20" y1="120" x2="180" y2="120" stroke="var(--border-color)" strokeWidth="2" />
                
                {/* Shining Sun positioned dynamically */}
                <g style={{ transform: azimuth === 'North' ? 'translate(-30px, 10px)' : 'translate(0px, 0px)' }}>
                  <circle cx="150" cy="40" r="14" fill="#f59e0b" className="sun-corona" />
                  {/* Sunrays flowing down and striking panel */}
                  <line x1="140" y1="50" x2="100" y2="100" stroke="#f59e0b" strokeWidth="1.5" className="sun-ray-flow" />
                  <line x1="130" y1="40" x2="80" y2="90" stroke="#f59e0b" strokeWidth="1.5" className="sun-ray-flow" />
                  <line x1="150" y1="55" x2="115" y2="105" stroke="#f59e0b" strokeWidth="1.5" className="sun-ray-flow" />
                </g>

                {/* Solar Panel mounting slope rotated dynamically based on 'tilt' state */}
                {/* We pivot mounting from (50, 120) */}
                <g style={{ transform: `rotate(${-tilt}deg)`, transformOrigin: '50px 120px', transition: 'transform var(--transition-normal)' }}>
                  {/* Base frame bracket */}
                  <line x1="50" y1="120" x2="110" y2="120" stroke="var(--text-muted)" strokeWidth="4" strokeLinecap="round" />
                  {/* Solar Panel block */}
                  <rect x="50" y="114" width="70" height="6" rx="1.5" fill="hsl(var(--color-solar))" stroke="var(--bg-secondary)" strokeWidth="1" />
                  {/* Panel solar grid details */}
                  <line x1="68" y1="114" x2="68" y2="120" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />
                  <line x1="86" y1="114" x2="86" y2="120" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />
                  <line x1="104" y1="114" x2="104" y2="120" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />
                </g>

                {/* Label angles */}
                <text x="30" y="135" fontSize="8" fill="var(--text-muted)" fontWeight="600">Mount Base</text>
                <text x="75" y="140" fontSize="8.5" fill="var(--text-primary)" fontWeight="bold">TILT SLOPE: {tilt}°</text>

              </svg>
            </div>

            {/* Sizing Outputs & Advisory text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Capture Percentage Indicator */}
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', mb: '4px' }}>Geographic Capture Efficiency</span>
                <h2 style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: 800, 
                  color: captureEfficiency >= 85 ? 'hsl(var(--color-gen))' : captureEfficiency >= 60 ? 'hsl(var(--color-solar))' : 'hsl(var(--color-con))' 
                }}>
                  {captureEfficiency}%
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Capture Index based on tilt and azimuth angles
                </span>
              </div>

              {/* Dynamic statement bubble */}
              <div style={{ 
                fontSize: '0.85rem', 
                color: 'var(--text-secondary)', 
                lineHeight: '1.5',
                padding: '12px',
                backgroundColor: captureEfficiency >= 85 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(249, 115, 22, 0.05)',
                border: '1px solid',
                borderColor: captureEfficiency >= 85 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                borderRadius: '8px'
              }}>
                {getAdvisoryText()}
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
