import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  HelpCircle, 
  Percent, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  Award,
  Copy,
  Check
} from 'lucide-react';

export default function Estimator({ 
  recommendation, 
  clearRecommendation,
  region,
  setRegion,
  sunHours,
  setSunHours,
  zipCode,
  setZipCode
}) {
  // Slider Inputs (defaults from calculator recommendations if available)
  const [monthlyBill, setMonthlyBill] = useState(180);
  const [roofArea, setRoofArea] = useState(650); // square feet
  const [selectedYearPoint, setSelectedYearPoint] = useState(null);
  const [copied, setCopied] = useState(false);

  // Constants
  const costPerWatt = 3.10; // $3.10 gross installed cost per watt average
  const gridRate = 0.16; // $ per kWh
  const panelWattage = 400; // watts per panel
  const panelArea = 18.5; // sq ft per panel
  const federalItcRate = 0.30; // 30% Federal Investment Tax Credit
  const utilityInflationRate = 0.035; // 3.5% average yearly increase in utility rates

  // Synchronize when a new recommendation is piped in from the Calculator
  useEffect(() => {
    if (recommendation) {
      if (recommendation.monthlyBill) {
        setMonthlyBill(Math.round(recommendation.monthlyBill));
      }
      // Estimate optimal roof space: panelCount * panelArea + 20% margin
      if (recommendation.panelCount) {
        const estimatedRoof = Math.round(recommendation.panelCount * panelArea * 1.2);
        setRoofArea(Math.min(2000, Math.max(100, estimatedRoof)));
      }
    }
  }, [recommendation]);

  // Sizing Math
  // Annual consumption (kWh) = (Monthly Bill / Grid Rate) * 12
  const annualConsumptionKwh = (monthlyBill / gridRate) * 12;
  const dailyConsumptionKwh = annualConsumptionKwh / 365;

  // System Sizing needed to offset 100% of consumption:
  // Size (kW) = (Daily kWh / sun hours) / efficiency factor (0.8)
  const neededSystemSizeKw = Math.round((dailyConsumptionKwh / sunHours / 0.8) * 10) / 10;
  
  // Roof Space Sizing limit:
  // How many panels physically fit on the roof area?
  const maxPanelsOnRoof = Math.floor(roofArea / panelArea);
  const maxRoofCapacityKw = Math.round(((maxPanelsOnRoof * panelWattage) / 1000) * 10) / 10;

  // Final Recommended System Size (constrained by roof capacity)
  const recommendedSystemSizeKw = Math.min(neededSystemSizeKw, maxRoofCapacityKw);
  const recommendedPanelCount = Math.round((recommendedSystemSizeKw * 1000) / panelWattage);
  const finalOffsetPercentage = neededSystemSizeKw > 0 
    ? Math.min(100, Math.round((recommendedSystemSizeKw / neededSystemSizeKw) * 100)) 
    : 0;

  // Financial Sizing Math
  const grossCost = recommendedSystemSizeKw * 1000 * costPerWatt;
  const federalItcDiscount = grossCost * federalItcRate;
  const netSystemCost = grossCost - federalItcDiscount;

  // Savings Math
  // Annual energy generated = System Size (kW) * sun hours * 365 days * efficiency (0.8)
  const annualGenerationKwh = recommendedSystemSizeKw * sunHours * 365 * 0.8;
  const annualSavingsYear1 = Math.min(annualConsumptionKwh, annualGenerationKwh) * gridRate;
  
  // Payback Period (Simple ROI) = Net Cost / Year 1 Savings
  const paybackPeriodYears = annualSavingsYear1 > 0 
    ? Math.round((netSystemCost / annualSavingsYear1) * 10) / 10 
    : 0;

  // 25-Year Cumulative Savings Data Generation
  // Modeling Year-by-Year compounding cashflows
  const generateCashflowData = () => {
    let cumulativeUtilityOnly = 0;
    let cumulativeWithSolar = netSystemCost; // Initial upfront net investment
    let utilityRate = gridRate;
    
    const yearlyProjections = [];

    for (let year = 1; year <= 25; year++) {
      // Utility pricing rises due to inflation
      const annualUtilityBillWithoutSolar = (monthlyBill * 12) * Math.pow(1 + utilityInflationRate, year - 1);
      cumulativeUtilityOnly += annualUtilityBillWithoutSolar;

      // Solar generation offset offsets standard bill
      // Standard annual generation gets valued at current inflating utility rate
      const solarEnergyValue = annualGenerationKwh * utilityRate;
      
      // Net bill is total consumption cost minus solar generation value (not going below zero if no grid battery credit scheme)
      const standardCostNoSolar = annualConsumptionKwh * utilityRate;
      const netBillWithSolar = Math.max(0, standardCostNoSolar - solarEnergyValue);
      
      // Cumulative expense includes annual residual bill plus small solar inverter replacement/maintenance cost in Year 12
      const annualMaintenance = year === 12 ? 1500 : 30; // $1500 inverter swap at Year 12
      cumulativeWithSolar += netBillWithSolar + annualMaintenance;

      // Inflate grid rates for next year
      utilityRate = utilityRate * (1 + utilityInflationRate);

      yearlyProjections.push({
        year,
        utilityOnly: Math.round(cumulativeUtilityOnly),
        withSolar: Math.round(cumulativeWithSolar),
        netSavings: Math.round(cumulativeUtilityOnly - cumulativeWithSolar)
      });
    }

    return yearlyProjections;
  };

  const cashflowData = generateCashflowData();
  const lifetimeSavings25Years = cashflowData[24].netSavings;

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Financial Cost & ROI Projections</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Simulate system pricing, apply government incentives, and plot your 25-year solar wealth and payback path.</p>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '0.85rem', 
            color: 'hsl(var(--color-solar))',
            fontWeight: 'bold',
            marginTop: '8px'
          }}>
            <span>📍 Active Location: {region} US (ZIP {zipCode}) — Sun Exposure: {sunHours} peak hrs/day</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          {recommendation && (
            <button 
              className="btn-outline" 
              onClick={clearRecommendation}
              style={{ 
                backgroundColor: 'rgba(16, 185, 129, 0.08)', 
                borderColor: '#10b981', 
                color: '#059669', 
                fontSize: '0.8rem',
                padding: '6px 12px'
              }}
            >
              ✓ Linked with Calculator Data
            </button>
          )}
          {/* Copy Summary Button */}
          <button
            className="btn-outline"
            onClick={() => {
              const summary = [
                `☀️ Solar Pulse — ROI Summary`,
                `Location: ${region} US (ZIP ${zipCode}) | ${sunHours} peak hrs/day`,
                ``,
                `📌 System Size: ${recommendedSystemSizeKw} kW (${recommendedPanelCount} x 400W panels)`,
                `💰 Gross Cost: $${Math.round(grossCost).toLocaleString()}`,
                `✅ Federal ITC (30%): -$${Math.round(federalItcDiscount).toLocaleString()}`,
                `💳 Net Capital Outlay: $${Math.round(netSystemCost).toLocaleString()}`,
                ``,
                `📅 Year 1 Savings: $${Math.round(annualSavingsYear1).toLocaleString()}/yr`,
                `⏱️ Payback Period: ${paybackPeriodYears} years`,
                `📊 25-Year Net Savings: $${lifetimeSavings25Years.toLocaleString()}`,
                ``,
                `Generated by Solar Pulse — ${new Date().toLocaleDateString()}`
              ].join('\n');
              navigator.clipboard.writeText(summary).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              });
            }}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            aria-label="Copy ROI summary to clipboard"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Summary'}
          </button>
        </div>
      </div>

      <div className="grid-cols-3">
        
        {/* Sliders Workstation */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Financial Simulation Inputs</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Monthly Bill Input */}
            <div className="form-group">
              <label className="form-label">
                <span>Avg Monthly Electric Bill</span>
                <span className="value">${monthlyBill}</span>
              </label>
              <input 
                type="range" 
                min="50" 
                max="800" 
                step="5"
                value={monthlyBill} 
                onChange={(e) => setMonthlyBill(parseInt(e.target.value))} 
              />
            </div>

            {/* Roof Sizing Input */}
            <div className="form-group">
              <label className="form-label">
                <span>Available Roof Area</span>
                <span className="value">{roofArea} sq ft</span>
              </label>
              <input 
                type="range" 
                min="100" 
                max="2000" 
                step="25"
                value={roofArea} 
                onChange={(e) => setRoofArea(parseInt(e.target.value))} 
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Fits up to **{maxPanelsOnRoof}** solar panels physically.
              </span>
            </div>

            {/* Sun Hours Input (Now bound directly to shared state props) */}
            <div className="form-group">
              <label className="form-label">
                <span>Daily Peak Sun Hours</span>
                <span className="value">{sunHours} hours</span>
              </label>
              <input 
                type="range" 
                min="2.0" 
                max="8.0" 
                step="0.1"
                value={sunHours} 
                onChange={(e) => setSunHours(parseFloat(e.target.value))} 
              />
            </div>

            {/* Constraints indicator */}
            {recommendedSystemSizeKw < neededSystemSizeKw && (
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: 'rgba(220, 38, 38, 0.9)',
                display: 'flex',
                gap: '8px'
              }}>
                <span>⚠️ **Roof Area Constrained**: Your roof space limits maximum system sizing to **{recommendedSystemSizeKw} kW**, covering **{finalOffsetPercentage}%** of your utility demand.</span>
              </div>
            )}

            {/* Solar specs summary */}
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Offset Ratio</span>
                <strong style={{ color: finalOffsetPercentage === 100 ? 'hsl(var(--color-gen))' : 'hsl(var(--color-solar))' }}>
                  {finalOffsetPercentage}% of usage
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>System Capacity</span>
                <strong>{recommendedSystemSizeKw} kW</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Required Panel Count</span>
                <strong>{recommendedPanelCount} Panels (400W)</strong>
              </div>
            </div>

          </div>
        </div>

        {/* ROI Cashflow Line Graph Card */}
        <div className="premium-card grid-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>25-Year Cumulative Cashflow</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Comparison of cumulative capital outflow with vs. without solar</p>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.7)' }}></span>
                Utility Only
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.7)' }}></span>
                With Solar
              </span>
            </div>
          </div>

          {/* Interactive Chart Canvas */}
          <div style={{ position: 'relative', width: '100%', height: '240px', padding: '10px 0' }}>
            <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              
              {/* Custom SVG Gradients */}
              <defs>
                <linearGradient id="utilityGlowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="solarRoiGlowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="30" y1="20" x2="480" y2="20" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="30" y1="65" x2="480" y2="65" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="30" y1="110" x2="480" y2="110" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="30" y1="155" x2="480" y2="155" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="30" y1="170" x2="480" y2="170" stroke="var(--border-color)" strokeWidth="1" />

              {/* Utility Only Area Shader */}
              <path
                d={`M 30,170 
                    L 30,${170 - (cashflowData[0].utilityOnly / 120000) * 150} 
                    L 120,${170 - (cashflowData[5].utilityOnly / 120000) * 150} 
                    L 210,${170 - (cashflowData[10].utilityOnly / 120000) * 150} 
                    L 300,${170 - (cashflowData[15].utilityOnly / 120000) * 150} 
                    L 390,${170 - (cashflowData[20].utilityOnly / 120000) * 150} 
                    L 478,${170 - (cashflowData[24].utilityOnly / 120000) * 150}
                    L 478,170 Z`}
                fill="url(#utilityGlowGrad)"
                className="chart-area-fade"
              />

              {/* With Solar Area Shader */}
              <path
                d={`M 30,${170 - (cashflowData[0].withSolar / 120000) * 150} 
                    L 120,${170 - (cashflowData[5].withSolar / 120000) * 150} 
                    L 210,${170 - (cashflowData[10].withSolar / 120000) * 150} 
                    L 300,${170 - (cashflowData[15].withSolar / 120000) * 150} 
                    L 390,${170 - (cashflowData[20].withSolar / 120000) * 150} 
                    L 478,${170 - (cashflowData[24].withSolar / 120000) * 150}
                    L 478,170
                    L 30,170 Z`}
                fill="url(#solarRoiGlowGrad)"
                className="chart-area-fade"
              />

              {/* Utility only climb curve (No Solar) */}
              <path
                d={`M 30,170 
                    L 30,${170 - (cashflowData[0].utilityOnly / 120000) * 150} 
                    L 120,${170 - (cashflowData[5].utilityOnly / 120000) * 150} 
                    L 210,${170 - (cashflowData[10].utilityOnly / 120000) * 150} 
                    L 300,${170 - (cashflowData[15].utilityOnly / 120000) * 150} 
                    L 390,${170 - (cashflowData[20].utilityOnly / 120000) * 150} 
                    L 478,${170 - (cashflowData[24].utilityOnly / 120000) * 150}`}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="chart-line-draw"
              />

              {/* With Solar Curve */}
              <path
                d={`M 30,${170 - (cashflowData[0].withSolar / 120000) * 150} 
                    L 120,${170 - (cashflowData[5].withSolar / 120000) * 150} 
                    L 210,${170 - (cashflowData[10].withSolar / 120000) * 150} 
                    L 300,${170 - (cashflowData[15].withSolar / 120000) * 150} 
                    L 390,${170 - (cashflowData[20].withSolar / 120000) * 150} 
                    L 478,${170 - (cashflowData[24].withSolar / 120000) * 150}`}
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="chart-line-draw-delayed"
              />

              {/* Data points triggers for key intervals */}
              {[1, 5, 10, 15, 20, 25].map((year, idx) => {
                const data = cashflowData[year - 1];
                const x = 30 + idx * 89.6;
                const yUtility = 170 - (data.utilityOnly / 120000) * 150;
                const ySolar = 170 - (data.withSolar / 120000) * 150;

                return (
                  <g key={year} style={{ cursor: 'pointer' }} onMouseEnter={() => setSelectedYearPoint({ year, ...data, index: idx })}>
                    <rect x={x - 25} y="10" width="50" height="170" fill="transparent" />
                    
                    {/* Dots */}
                    <circle cx={x} cy={yUtility} r="5" fill="#f43f5e" stroke="var(--bg-secondary)" strokeWidth="2.5" className="chart-dot-pulse" style={{ animationDelay: `${idx * 0.15}s` }} />
                    <circle cx={x} cy={ySolar} r="5" fill="#10b981" stroke="var(--bg-secondary)" strokeWidth="2.5" className="chart-dot-pulse" style={{ animationDelay: `${idx * 0.15 + 0.3}s` }} />

                    <text x={x} y="190" textAnchor="middle" fontSize="8.5" fill="var(--text-secondary)" fontWeight="600">
                      Yr {year}
                    </text>
                  </g>
                );
              })}

            </svg>

            {/* Cumulative Cashflow floating tooltip */}
            {selectedYearPoint && (
              <div style={{
                position: 'absolute',
                top: '20px',
                left: `${20 + selectedYearPoint.index * 13}%`,
                transform: 'translateX(-50%)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 14px',
                boxShadow: 'var(--shadow-md)',
                zIndex: 10,
                fontSize: '0.8rem',
                minWidth: '170px',
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                backdropFilter: 'blur(8px)'
              }}>
                <div style={{ fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', pb: '4px', mb: '4px', color: 'var(--text-primary)' }}>
                  Cumulative Cost: Year {selectedYearPoint.year}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f43f5e', fontWeight: 600 }}>
                  <span>Utility Only:</span>
                  <span>${selectedYearPoint.utilityOnly.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 600 }}>
                  <span>With Solar:</span>
                  <span>${selectedYearPoint.withSolar.toLocaleString()}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  color: selectedYearPoint.netSavings >= 0 ? '#10b981' : '#f43f5e',
                  fontWeight: 700,
                  borderTop: '1px solid var(--border-color)',
                  marginTop: '4px',
                  paddingTop: '4px'
                }}>
                  <span>Net Savings:</span>
                  <span>{selectedYearPoint.netSavings >= 0 ? `$${selectedYearPoint.netSavings.toLocaleString()}` : `-$${Math.abs(selectedYearPoint.netSavings).toLocaleString()}`}</span>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Detail Financial Projections Ledger */}
      <div className="grid-cols-3">
        
        {/* Cost breakdown checklist */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={18} style={{ color: 'hsl(var(--color-solar))' }} />
            Capital Allocation Statement
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Gross Installed System Cost</span>
              <strong>${Math.round(grossCost).toLocaleString()}</strong>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--color-gen))', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Federal ITC Discount (30%) <Percent size={12} />
              </span>
              <span>-${Math.round(federalItcDiscount).toLocaleString()}</span>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              borderTop: '1px solid var(--border-color)', 
              paddingTop: '12px',
              fontWeight: 'bold', 
              fontSize: '1rem',
              color: 'var(--text-primary)'
            }}>
              <span>Net Capital Outlay</span>
              <span>${Math.round(netSystemCost).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Investment Return Metrics */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: '#10b981' }} />
            Investment Returns Ledger
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Year 1 Utility Savings</span>
              <strong>${Math.round(annualSavingsYear1).toLocaleString()} / year</strong>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Projected Payback Window</span>
              <strong style={{ 
                backgroundColor: paybackPeriodYears <= 7 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                color: paybackPeriodYears <= 7 ? '#059669' : '#d97706',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                {paybackPeriodYears} Years
              </strong>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              borderTop: '1px solid var(--border-color)', 
              paddingTop: '12px',
              fontWeight: 'bold', 
              fontSize: '1rem',
              color: '#10b981'
            }}>
              <span>25-Yr Cumulative Returns</span>
              <span>${lifetimeSavings25Years.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Technical Warranty & Performance standards */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} style={{ color: 'hsl(var(--color-bat))' }} />
            System Performance Warranty
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <p>✓ **25-Year Production Guarantee**: Solar panels are warrantied to retain at least **85.5%** of original power capacity in Year 25.</p>
            <p>✓ **Inverter Lifecycle**: Modern grid-tie microinverters carry a 15-25 year warranty. A central inverter buffer is calculated in Year 12 projections.</p>
            <p>✓ **Property Appreciation**: Residential solar installations raise local appraisal values by an average of **4.1%** tax-free.</p>
          </div>
        </div>

      </div>

    </div>
  );
}
