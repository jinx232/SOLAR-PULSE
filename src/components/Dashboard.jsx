import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  TrendingUp, 
  Battery, 
  Leaf, 
  CloudSun, 
  Clock, 
  Zap, 
  Activity, 
  AlertCircle,
  User,
  Mail
} from 'lucide-react';

export default function Dashboard({ user }) {
  // Live Simulation States
  const [time, setTime] = useState(new Date());
  const [solarGen, setSolarGen] = useState(4.28); // in kW
  const [houseCon, setHouseCon] = useState(2.15); // in kW
  const [batterySoc, setBatterySoc] = useState(68); // Battery State of Charge (%)
  const [cloudCover, setCloudCover] = useState(20); // % cloud cover
  const [temperature, setTemperature] = useState(24); // °C
  const [selectedChartPoint, setSelectedChartPoint] = useState(null);

  // Constants
  const maxBatteryCapacity = 13.5; // Tesla Powerwall standard (kWh)
  const gridRate = 0.16; // $ per kWh

  // Live simulation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());

      // Simulate subtle weather adjustments
      setCloudCover(prev => {
        const change = (Math.random() - 0.5) * 5;
        return Math.min(100, Math.max(0, Math.round(prev + change)));
      });

      setTemperature(prev => {
        const change = (Math.random() - 0.5) * 0.4;
        return Math.min(45, Math.max(-5, Math.round((prev + change) * 10) / 10));
      });

      // Calculate solar based on cloud cover and simulated time of day (12:00 peak)
      const currentHour = new Date().getHours() + new Date().getMinutes() / 60;
      let solarFactor = 0;
      if (currentHour >= 6 && currentHour <= 18) {
        // Bell curve peaking at 12:00
        solarFactor = Math.sin((currentHour - 6) * Math.PI / 12);
      }
      
      const maxPossibleGen = 6.5; // kW max capacity
      const cloudEfficiency = (100 - cloudCover * 0.75) / 100;
      const simulatedGen = maxPossibleGen * solarFactor * cloudEfficiency;
      setSolarGen(Math.round(Math.max(0, simulatedGen) * 100) / 100);

      // Simulate household consumption fluctuating (major appliances clicking on/off)
      setHouseCon(prev => {
        const fluctuation = (Math.random() - 0.5) * 0.6;
        let base = 1.8;
        // Peak hours (evening load)
        const hour = new Date().getHours();
        if (hour >= 17 && hour <= 21) base = 3.2;
        if (hour >= 23 || hour <= 5) base = 0.8; // Night baseline
        return Math.round(Math.max(0.3, base + fluctuation) * 100) / 100;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Update battery based on power balance
  useEffect(() => {
    const interval = setInterval(() => {
      // Power balance in kW: Solar Gen - House Con
      // 1-second step contribution: kW * (1/3600 hrs) = kWh
      const netPower = solarGen - houseCon;
      const energyDeltaKwh = netPower * (1.5 / 3600); // simulated accelerated charge rate
      
      setBatterySoc(prev => {
        const currentChargeKwh = (prev / 100) * maxBatteryCapacity;
        const newChargeKwh = Math.min(maxBatteryCapacity, Math.max(0, currentChargeKwh + energyDeltaKwh));
        return Math.round((newChargeKwh / maxBatteryCapacity) * 100);
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [solarGen, houseCon]);

  // Derived metrics
  const netPowerBalance = Math.round((solarGen - houseCon) * 100) / 100;
  const isCharging = netPowerBalance > 0;
  
  // Simulated Historical Data for Custom SVG Chart
  // Represents energy throughout the day
  const hourlyData = [
    { hour: '06:00', generation: 0.1, consumption: 0.8 },
    { hour: '08:00', generation: 1.2, consumption: 1.5 },
    { hour: '10:00', generation: 3.5, consumption: 2.1 },
    { hour: '12:00', generation: 5.8, consumption: 1.9 },
    { hour: '14:00', generation: 5.2, consumption: 2.3 },
    { hour: '16:00', generation: 3.1, consumption: 2.8 },
    { hour: '18:00', generation: 0.8, consumption: 3.4 },
    { hour: '20:00', generation: 0.0, consumption: 3.1 },
    { hour: '22:00', generation: 0.0, consumption: 1.4 },
  ];

  // Calculations for environmental metrics
  // Average cumulative lifetime metrics (simulated installation from 1 year ago)
  const totalLifetimeGenerationKwh = 7842.5; 
  const co2OffsetKg = Math.round(totalLifetimeGenerationKwh * 0.709); // 0.709 kg CO2 per kWh grid average
  const treesPlanted = Math.round(co2OffsetKg / 21.8); // 1 tree offsets ~21.8 kg CO2 per year

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Solar Analyst';
  const userEmail = user?.email || 'Not signed in';
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Profile Summary Card */}
      <div className="premium-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '22px',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(135deg, hsl(var(--color-solar)) 0%, hsl(var(--color-gen)) 100%)',
            color: '#fff',
            fontSize: '1.8rem',
            fontWeight: 800,
            boxShadow: '0 18px 40px -30px rgba(249, 115, 22, 0.8)',
            overflow: 'hidden'
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Profile Summary</p>
            <h2 style={{ margin: '8px 0 4px', fontSize: '1.75rem', fontWeight: 800 }}>{userName}</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>{userEmail}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'grid', placeItems: 'center', width: '54px', height: '54px', borderRadius: '16px', background: 'rgba(255,255,255,0.06)' }}>
            <User size={24} />
          </div>
          <div style={{ display: 'grid', placeItems: 'center', width: '54px', height: '54px', borderRadius: '16px', background: 'rgba(255,255,255,0.06)' }}>
            <Mail size={24} />
          </div>
        </div>
      </div>

      {/* Simulation Header Alerts */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        backgroundColor: 'rgba(249, 115, 22, 0.05)',
        border: '1px solid rgba(249, 115, 22, 0.15)',
        borderRadius: '12px',
        fontSize: '0.9rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'flex', alignContent: 'center', alignItems: 'center', gap: '10px' }}>
          <Activity size={18} className="logo-icon" />
          <span><strong>Live Simulation Active</strong>: Solar metrics and battery state are fluctuating in real time. Try modifying weather variables below!</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
          <Clock size={16} />
          <span>{time.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Grid of Key Metrics Cards */}
      <div className="grid-cols-4">
        
        {/* Solar Generation Card */}
        <div className="premium-card" style={{ 
          borderLeft: '4px solid hsl(var(--color-solar))',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Solar Generation</span>
            <Sun size={24} style={{ color: 'hsl(var(--color-solar))' }} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '6px' }}>
            {solarGen} <span style={{ fontSize: '1rem', fontWeight: 500 }}>kW</span>
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'hsl(var(--color-gen))', fontWeight: 700 }}>● Active</span>
            <span>Capacity Factor: {Math.round((solarGen / 6.5) * 100)}%</span>
          </div>
          <div style={{
            position: 'absolute',
            bottom: 0, right: 0, left: 0, height: '4px',
            background: 'linear-gradient(90deg, transparent, hsl(var(--color-solar)), transparent)',
            opacity: 0.3
          }}></div>
        </div>

        {/* Home Consumption Card */}
        <div className="premium-card" style={{ 
          borderLeft: '4px solid hsl(var(--color-con))',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Home Consumption</span>
            <Zap size={24} style={{ color: 'hsl(var(--color-con))' }} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '6px' }}>
            {houseCon} <span style={{ fontSize: '1rem', fontWeight: 500 }}>kW</span>
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Grid Import: {netPowerBalance < 0 ? Math.abs(netPowerBalance) + ' kW' : '0.00 kW'}
          </div>
        </div>

        {/* Battery Storage Card */}
        <div className="premium-card" style={{ 
          borderLeft: '4px solid hsl(var(--color-bat))',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Battery Storage</span>
            <Battery size={24} style={{ color: 'hsl(var(--color-bat))' }} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '6px' }}>
            {batterySoc}% <span style={{ fontSize: '1rem', fontWeight: 500 }}>SOC</span>
          </h2>
          {/* Animated battery fill bar */}
          <div style={{ height: '6px', borderRadius: '99px', backgroundColor: 'var(--border-color)', overflow: 'hidden', marginBottom: '6px' }}>
            <div style={{
              height: '100%',
              width: `${batterySoc}%`,
              borderRadius: '99px',
              background: batterySoc > 40
                ? 'linear-gradient(90deg, hsl(var(--color-gen)), hsl(142, 80%, 55%))'
                : batterySoc > 20
                ? 'linear-gradient(90deg, hsl(var(--color-solar)), #f59e0b)'
                : 'linear-gradient(90deg, #ef4444, #f43f5e)',
              transition: 'width 1.5s cubic-bezier(0.2, 0.8, 0.2, 1), background 1s ease'
            }} />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ 
              color: isCharging ? 'hsl(var(--color-gen))' : 'hsl(var(--color-solar))', 
              fontWeight: 700 
            }}>
              {isCharging ? '▲ Charging' : netPowerBalance === 0 ? '● Standby' : '▼ Discharging'}
            </span>
            <span>({Math.round((batterySoc / 100) * maxBatteryCapacity * 10) / 10} / {maxBatteryCapacity} kWh)</span>
          </div>
        </div>

        {/* Environmental Impact Card */}
        <div className="premium-card" style={{ 
          borderLeft: '4px solid #10b981',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Carbon Avoided</span>
            <Leaf size={24} style={{ color: '#10b981' }} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '6px' }}>
            {co2OffsetKg.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 500 }}>kg CO₂</span>
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            🌳 Equivalency: <strong>{treesPlanted}</strong> mature trees planted
          </div>
        </div>

      </div>

      {/* Main Charts & Solar Weather Grid */}
      <div className="grid-cols-3">
        
        {/* Interactive Custom SVG Chart */}
        <div className="premium-card grid-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Energy Balance Profile</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Interactive generated vs. consumed household energy curves</p>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'rgba(249, 115, 22, 0.7)' }}></span>
                Solar Gen
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'rgba(236, 72, 153, 0.7)' }}></span>
                Home Consumption
              </span>
            </div>
          </div>

          {/* Interactive Chart Workspace */}
          <div style={{ position: 'relative', width: '100%', height: '240px', padding: '10px 0' }}>
            <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              
              {/* Grid Lines */}
              <line x1="30" y1="20" x2="480" y2="20" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="30" y1="65" x2="480" y2="65" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="30" y1="110" x2="480" y2="110" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="30" y1="155" x2="480" y2="155" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="30" y1="170" x2="480" y2="170" stroke="var(--border-color)" strokeWidth="1" />

              {/* Solar Generation Area Shader */}
              <path
                d={`M 30,170 
                    L 30,${170 - (hourlyData[0].generation / 6.5) * 150} 
                    L 86,${170 - (hourlyData[1].generation / 6.5) * 150} 
                    L 142,${170 - (hourlyData[2].generation / 6.5) * 150} 
                    L 198,${170 - (hourlyData[3].generation / 6.5) * 150} 
                    L 254,${170 - (hourlyData[4].generation / 6.5) * 150} 
                    L 310,${170 - (hourlyData[5].generation / 6.5) * 150} 
                    L 366,${170 - (hourlyData[6].generation / 6.5) * 150} 
                    L 422,${170 - (hourlyData[7].generation / 6.5) * 150} 
                    L 478,${170 - (hourlyData[8].generation / 6.5) * 150} 
                    L 478,170 Z`}
                fill="url(#solarGlowGrad)"
                className="chart-area-fade"
              />

              {/* Custom SVG Gradients */}
              <defs>
                <linearGradient id="solarGlowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--color-solar))" />
                  <stop offset="100%" stopColor="hsl(var(--color-solar))" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Solar Generation Line */}
              <path
                d={`M 30,${170 - (hourlyData[0].generation / 6.5) * 150} 
                    L 86,${170 - (hourlyData[1].generation / 6.5) * 150} 
                    L 142,${170 - (hourlyData[2].generation / 6.5) * 150} 
                    L 198,${170 - (hourlyData[3].generation / 6.5) * 150} 
                    L 254,${170 - (hourlyData[4].generation / 6.5) * 150} 
                    L 310,${170 - (hourlyData[5].generation / 6.5) * 150} 
                    L 366,${170 - (hourlyData[6].generation / 6.5) * 150} 
                    L 422,${170 - (hourlyData[7].generation / 6.5) * 150} 
                    L 478,${170 - (hourlyData[8].generation / 6.5) * 150}`}
                fill="none"
                stroke="hsl(var(--color-solar))"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="chart-line-draw"
              />

              {/* Home Consumption Line */}
              <path
                d={`M 30,${170 - (hourlyData[0].consumption / 6.5) * 150} 
                    L 86,${170 - (hourlyData[1].consumption / 6.5) * 150} 
                    L 142,${170 - (hourlyData[2].consumption / 6.5) * 150} 
                    L 198,${170 - (hourlyData[3].consumption / 6.5) * 150} 
                    L 254,${170 - (hourlyData[4].consumption / 6.5) * 150} 
                    L 310,${170 - (hourlyData[5].consumption / 6.5) * 150} 
                    L 366,${170 - (hourlyData[6].consumption / 6.5) * 150} 
                    L 422,${170 - (hourlyData[7].consumption / 6.5) * 150} 
                    L 478,${170 - (hourlyData[8].consumption / 6.5) * 150}`}
                fill="none"
                stroke="hsl(var(--color-con))"
                strokeWidth="3"
                strokeLinecap="round"
                className="chart-line-draw-delayed"
              />

              {/* Interactive Data Hover Dots & Triggers */}
              {hourlyData.map((d, index) => {
                const x = 30 + index * 56;
                const ySolar = 170 - (d.generation / 6.5) * 150;
                const yCon = 170 - (d.consumption / 6.5) * 150;

                return (
                  <g key={index} style={{ cursor: 'pointer' }} onMouseEnter={() => setSelectedChartPoint({ index, ...d })}>
                    {/* Hover Trigger bar */}
                    <rect x={x - 20} y="10" width="40" height="170" fill="transparent" />

                    {/* Solar Point */}
                    <circle cx={x} cy={ySolar} r="4" fill="hsl(var(--color-solar))" stroke="var(--bg-secondary)" strokeWidth="2" className="chart-dot-pulse" style={{ animationDelay: `${index * 0.1}s` }} />
                    {/* Consumption Point */}
                    <circle cx={x} cy={yCon} r="4" fill="hsl(var(--color-con))" stroke="var(--bg-secondary)" strokeWidth="2" className="chart-dot-pulse" style={{ animationDelay: `${index * 0.1 + 0.2}s` }} />

                    {/* X-Axis Labels */}
                    <text x={x} y="190" textAnchor="middle" fontSize="8" fill="var(--text-secondary)" fontWeight="600">
                      {d.hour}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Custom Interactive Floating Tooltip */}
            {selectedChartPoint && (
              <div style={{
                position: 'absolute',
                top: '10px',
                left: `${30 + selectedChartPoint.index * 9.5}%`,
                transform: 'translateX(-50%)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 14px',
                boxShadow: 'var(--shadow-md)',
                zIndex: 10,
                fontSize: '0.8rem',
                minWidth: '150px',
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                backdropFilter: 'blur(8px)'
              }}>
                <div style={{ fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', pb: '4px', mb: '4px', color: 'var(--text-primary)' }}>
                  Time: {selectedChartPoint.hour}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--color-solar))', fontWeight: 600 }}>
                  <span>Generation:</span>
                  <span>{selectedChartPoint.generation} kW</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--color-con))', fontWeight: 600 }}>
                  <span>Consumption:</span>
                  <span>{selectedChartPoint.consumption} kW</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  color: selectedChartPoint.generation - selectedChartPoint.consumption >= 0 ? 'hsl(var(--color-gen))' : 'hsl(var(--color-con))',
                  fontWeight: 700,
                  borderTop: '1px solid var(--border-color)',
                  marginTop: '4px',
                  paddingTop: '4px'
                }}>
                  <span>Net:</span>
                  <span>{Math.round((selectedChartPoint.generation - selectedChartPoint.consumption) * 100) / 100} kW</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Solar Cloud Cover & Weather Potential Card */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CloudSun style={{ color: 'hsl(var(--color-solar))' }} />
            Solar Environment
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Solar Potential Ratio */}
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Solar Potential</span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'hsl(var(--color-solar))' }}>
                {Math.round((100 - cloudCover * 0.75))}%
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {cloudCover < 15 ? 'Excellent conditions! Clear Skies.' : cloudCover < 50 ? 'Partly cloudy. Moderate Output.' : 'High overcast. Reduced potential.'}
              </span>
            </div>

            {/* Weather Interactive Modifiers */}
            <div className="form-group">
              <label className="form-label">
                <span>Simulated Cloud Cover</span>
                <span className="value">{cloudCover}%</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={cloudCover} 
                onChange={(e) => setCloudCover(parseInt(e.target.value))} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderTop: '1px solid var(--border-color)', pt: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>TEMPERATURE</span>
                <span style={{ fontWeight: 600 }}>{temperature}°C</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>UV INDEX</span>
                <span style={{ fontWeight: 600, color: cloudCover < 20 ? 'red' : 'orange' }}>
                  {Math.max(1, Math.round(9 * (100 - cloudCover) / 100))} (High)
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Grid of Auxiliary Widgets */}
      <div className="grid-cols-3">
        
        {/* Real-time Savings Tracker */}
        <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: '#10b981'
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Lifetime Financial Savings</h4>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
              ${Math.round(totalLifetimeGenerationKwh * gridRate).toLocaleString()}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated offset at standard utility rates</span>
          </div>
        </div>

        {/* Battery Health Indicator */}
        <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            backgroundColor: 'var(--color-bat-glow)',
            display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'hsl(var(--color-bat))'
          }}>
            <Battery size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>System Health & State</h4>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'hsl(var(--color-gen))' }}>Optimal (98.4%)</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Thermal regulation and cell balances online</span>
          </div>
        </div>

        {/* Live System Alerts */}
        <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: '#3b82f6'
          }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Smart Power Alert</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isCharging 
                ? 'Solar excess is currently charging the backup battery storage.' 
                : 'Battery storage discharging to power active household loads.'
              }
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
