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
  Check,
  Globe
} from 'lucide-react';
import { globalSolarZones, normalizeSolarZone } from './Calculator';
import { useSolar } from '../context/SolarContext';

export const getRegionalEconomics = (region) => {
  const reg = (region || '').toLowerCase();
  
  if (reg.includes('west africa') || reg.includes('africa')) {
    return {
      currency: 'NGN',
      symbol: '₦',
      gridRate: 225, // Band A NERC tariff ~₦225/kWh
      costPerWatt: 1800, // ~₦1,800/W installed turnkey tier-1 system with hybrid inverter
      utilityInflationRate: 0.12,
      defaultBill: 120000,
      minBill: 15000,
      maxBill: 800000,
      billStep: 5000,
      inverterSwapCost: 1200000, // ₦1.2M inverter swap buffer at Yr 12
      annualMaintenance: 30000,
      hasGeneratorOffset: true,
      fuelPricePerLiter: 1150, // ₦1,150/L petrol/diesel
      itcRate: 0,
      itcLabel: 'Tax Incentive / Rebate',
      itcNote: 'No federal ITC applied. Primary ROI is driven by displacing expensive generator fuel (₦1,150/L) and Band A grid tariffs.'
    };
  }

  if (reg.includes('western europe') || reg.includes('uk') || reg.includes('britain')) {
    return {
      currency: 'GBP',
      symbol: '£',
      gridRate: 0.28,
      costPerWatt: 1.85,
      utilityInflationRate: 0.045,
      defaultBill: 160,
      minBill: 40,
      maxBill: 800,
      billStep: 5,
      inverterSwapCost: 1200,
      annualMaintenance: 25,
      hasGeneratorOffset: false,
      fuelPricePerLiter: 0,
      itcRate: 0.05,
      itcLabel: 'Clean Energy VAT Relief (5%)',
      itcNote: 'UK 0–5% VAT relief on qualifying residential energy-saving materials.'
    };
  }

  if (reg.includes('southern europe') || reg.includes('europe')) {
    return {
      currency: 'EUR',
      symbol: '€',
      gridRate: 0.26,
      costPerWatt: 1.95,
      utilityInflationRate: 0.04,
      defaultBill: 170,
      minBill: 40,
      maxBill: 800,
      billStep: 5,
      inverterSwapCost: 1300,
      annualMaintenance: 25,
      hasGeneratorOffset: false,
      fuelPricePerLiter: 0,
      itcRate: 0,
      itcLabel: 'Regional Feed-In Tariff',
      itcNote: 'EU feed-in tariff and local municipality clean energy subsidies apply.'
    };
  }

  if (reg.includes('north america') || reg.includes('us ') || reg === 'us') {
    return {
      currency: 'USD',
      symbol: '$',
      gridRate: 0.16,
      costPerWatt: 3.10,
      utilityInflationRate: 0.035,
      defaultBill: 180,
      minBill: 50,
      maxBill: 1000,
      billStep: 5,
      inverterSwapCost: 1500,
      annualMaintenance: 30,
      hasGeneratorOffset: false,
      fuelPricePerLiter: 0,
      itcRate: 0.26,
      itcLabel: 'US Federal ITC (26%)',
      itcNote: 'The residential ITC dropped to 26% after 2025 (July 2025 budget law). Verify with your tax adviser.'
    };
  }

  return {
    currency: 'USD',
    symbol: '$',
    gridRate: 0.18,
    costPerWatt: 2.80,
    utilityInflationRate: 0.04,
    defaultBill: 180,
    minBill: 50,
    maxBill: 1000,
    billStep: 5,
    inverterSwapCost: 1500,
    annualMaintenance: 30,
    hasGeneratorOffset: false,
    fuelPricePerLiter: 0,
    itcRate: 0,
    itcLabel: 'Solar Incentive / Rebate',
    itcNote: 'Check local utility company for net-metering and state clean energy credits.'
  };
};

export default function Estimator({ 
  recommendation: propRecommendation, 
  clearRecommendation: propClearRecommendation,
  region: propRegion,
  setRegion: propSetRegion,
  sunHours: propSunHours,
  setSunHours: propSetSunHours,
  zipCode: propZipCode,
  setZipCode: propSetZipCode
}) {
  const solar = useSolar();
  const recommendation = propRecommendation ?? solar.recommendation;
  const clearRecommendation = propClearRecommendation ?? solar.clearRecommendation;
  const region = propRegion ?? solar.region;
  const setRegion = propSetRegion ?? solar.setRegion;
  const sunHours = propSunHours ?? solar.sunHours;
  const setSunHours = propSetSunHours ?? solar.setSunHours;
  const zipCode = propZipCode ?? solar.zipCode;
  const setZipCode = propSetZipCode ?? solar.setZipCode;

  const econ = getRegionalEconomics(region);

  // Slider Inputs (defaults from calculator recommendations if available)
  const [monthlyBill, setMonthlyBill] = useState(econ.defaultBill);
  const [roofArea, setRoofArea] = useState(650); // square feet
  const [displacedGenHours, setDisplacedGenHours] = useState(4); // daily gen runtime displaced (hrs/day)
  const [selectedYearPoint, setSelectedYearPoint] = useState(null);
  const [copied, setCopied] = useState(false);

  // Constants
  const costPerWatt = econ.costPerWatt;
  const gridRate = econ.gridRate;
  const panelWattage = 400; // watts per panel
  const panelArea = 18.5; // sq ft per panel
  const utilityInflationRate = econ.utilityInflationRate;

  // Ensure monthly bill slider stays within sane bounds when switching regions
  useEffect(() => {
    if (!recommendation?.monthlyBill) {
      if (monthlyBill < econ.minBill || monthlyBill > econ.maxBill) {
        setMonthlyBill(econ.defaultBill);
      }
    }
  }, [region, econ.minBill, econ.maxBill, econ.defaultBill, recommendation]);

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

  // Region-aware incentives
  const isNorthAmerica = region && (region.toLowerCase().includes('north america') || region.toLowerCase().includes('us ') || region === 'us');
  const federalItcRate = econ.itcRate;
  const itcLabel = econ.itcLabel;
  const itcNote = econ.itcNote;

  // Financial Sizing Math
  const grossCost = recommendedSystemSizeKw * 1000 * costPerWatt;
  const federalItcDiscount = grossCost * federalItcRate;
  const netSystemCost = grossCost - federalItcDiscount;

  // Savings Math
  // Annual energy generated = System Size (kW) * sun hours * 365 days * efficiency (0.8)
  const annualGenerationKwh = recommendedSystemSizeKw * sunHours * 365 * 0.8;
  const annualSavingsYear1 = Math.min(annualConsumptionKwh, annualGenerationKwh) * gridRate;

  // Generator fuel offset savings (when applicable)
  const monthlyFuelSavings = econ.hasGeneratorOffset 
    ? Math.round(displacedGenHours * 1.2 * econ.fuelPricePerLiter * 30.4) 
    : 0;
  const annualFuelSavings = monthlyFuelSavings * 12;

  // Payback Period (Simple ROI) = Net Cost / (Year 1 Utility Savings + Fuel Savings)
  const totalAnnualSavingsYear1 = annualSavingsYear1 + annualFuelSavings;
  const paybackPeriodYears = totalAnnualSavingsYear1 > 0 
    ? Math.round((netSystemCost / totalAnnualSavingsYear1) * 10) / 10 
    : 0;

  // 25-Year Cumulative Savings Data Generation
  // Modeling Year-by-Year compounding cashflows
  const generateCashflowData = () => {
    let cumulativeUtilityOnly = 0;
    let cumulativeWithSolar = netSystemCost; // Initial upfront net investment
    let utilityRate = gridRate;
    
    const yearlyProjections = [];

    for (let year = 1; year <= 25; year++) {
      // Escalating utility bill without solar
      const annualUtilityBillWithoutSolar = (monthlyBill * 12) * Math.pow(1 + utilityInflationRate, year - 1);
      // Escalating fuel expenditure without solar (if generator is displaced)
      const annualFuelExpenseWithoutSolar = annualFuelSavings * Math.pow(1 + utilityInflationRate, year - 1);
      
      cumulativeUtilityOnly += annualUtilityBillWithoutSolar + annualFuelExpenseWithoutSolar;

      // Solar generation offset accounts for 0.5% annual panel degradation
      const degradationFactor = Math.pow(1 - 0.005, year - 1);
      const yearGenerationKwh = annualGenerationKwh * degradationFactor;
      const solarEnergyValue = yearGenerationKwh * utilityRate;
      
      // Net bill is total consumption cost minus solar generation value
      const standardCostNoSolar = annualConsumptionKwh * utilityRate;
      const netBillWithSolar = Math.max(0, standardCostNoSolar - solarEnergyValue);
      
      // Cumulative expense includes annual residual bill plus inverter replacement buffer in Year 12
      const annualMaintenance = year === 12 ? econ.inverterSwapCost : econ.annualMaintenance;
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

  // Inflation-adjusted break-even year where cumulative solar net savings turn positive
  const breakEvenProj = cashflowData.find(p => p.netSavings >= 0);
  const breakEvenYear = breakEvenProj ? breakEvenProj.year : null;

  // Dynamic y-axis max so the chart never clips large bills
  const chartMax = Math.max(
    cashflowData[24].utilityOnly,
    cashflowData[24].withSolar,
    netSystemCost * 1.4,
    1000
  ) * 1.05; // 5% headroom

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Title */}
      <div className="estimator-header">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Financial Cost & ROI Projections</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Simulate system pricing, apply government incentives, and plot your 25-year solar wealth and payback path.</p>
          <div className="estimator-zone-select-wrap">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
              <Globe size={16} /> Global Solar Zone:
            </span>
            <select
              value={region}
              onChange={(e) => {
                const zone = globalSolarZones.find((z) => z.value === e.target.value) || normalizeSolarZone(e.target.value);
                setRegion(zone.value);
                setSunHours(zone.sunHours);
                if (zone.postal) setZipCode(zone.postal);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                maxWidth: '100%'
              }}
            >
              {Array.from(new Set(globalSolarZones.map((z) => z.continent))).map((continent) => (
                <optgroup key={continent} label={continent}>
                  {globalSolarZones
                    .filter((zone) => zone.continent === continent)
                    .map((zone) => (
                      <option key={zone.value} value={zone.value}>
                        {zone.label}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal', fontSize: '0.8rem' }}>
              ({sunHours} peak hrs/day • Postal code {zipCode})
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {recommendation && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{ 
                  backgroundColor: 'rgba(16, 185, 129, 0.08)', 
                  borderRadius: '8px',
                  border: '1px solid #10b981', 
                  color: '#059669', 
                  fontSize: '0.8rem',
                  padding: '8px 14px',
                  fontWeight: 600
                }}
              >
                ✓ Linked with Calculator Data
              </span>
              <button
                className="btn-outline"
                onClick={clearRecommendation}
                title="Unlink calculator data"
                aria-label="Unlink calculator recommendation"
                style={{ padding: '8px 10px', minHeight: '38px', fontSize: '0.75rem' }}
              >
                × Unlink
              </button>
            </div>
          )}
          {/* Copy Summary Button */}
          <button
            className="btn-outline"
            onClick={() => {
              const summary = [
                `☀️ Solar Pulse — ROI Summary`,
                `Location: ${region} (Postal code ${zipCode}) | ${sunHours} peak hrs/day`,
                ``,
                `📌 System Size: ${recommendedSystemSizeKw} kW (${recommendedPanelCount} x 400W panels)`,
                `💰 Gross Cost: ${econ.symbol}${Math.round(grossCost).toLocaleString()}`,
                federalItcDiscount > 0 ? `✅ ${itcLabel}: -${econ.symbol}${Math.round(federalItcDiscount).toLocaleString()}` : null,
                `💳 Net Capital Outlay: ${econ.symbol}${Math.round(netSystemCost).toLocaleString()}`,
                ``,
                `⚡ Year 1 Utility Savings: ${econ.symbol}${Math.round(annualSavingsYear1).toLocaleString()}/yr`,
                econ.hasGeneratorOffset && annualFuelSavings > 0 ? `⛽ Generator Fuel Displaced: ${econ.symbol}${Math.round(annualFuelSavings).toLocaleString()}/yr` : null,
                `📅 Combined Year 1 Savings: ${econ.symbol}${Math.round(totalAnnualSavingsYear1).toLocaleString()}/yr`,
                `⏱️ Payback Period: ${paybackPeriodYears} years`,
                `📊 25-Year Net Returns: ${econ.symbol}${lifetimeSavings25Years.toLocaleString()}`,
                ``,
                `Generated by Solar Pulse — ${new Date().toLocaleDateString()}`
              ].filter(Boolean).join('\n');
              navigator.clipboard.writeText(summary).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              });
            }}
            style={{ fontSize: '0.85rem', padding: '8px 14px', minHeight: '38px' }}
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
                <span className="value">{econ.symbol}{monthlyBill.toLocaleString()}</span>
              </label>
              <input 
                type="range" 
                min={econ.minBill} 
                max={econ.maxBill} 
                step={econ.billStep}
                value={monthlyBill} 
                onChange={(e) => setMonthlyBill(parseInt(e.target.value))} 
              />
            </div>

            {/* Generator Runtime Offset Input (West Africa & outage-prone regions) */}
            {econ.hasGeneratorOffset && (
              <div className="form-group" style={{
                padding: '12px 14px',
                backgroundColor: 'rgba(249, 115, 22, 0.05)',
                borderRadius: '10px',
                border: '1px solid rgba(249, 115, 22, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  <span style={{ fontWeight: 600 }}>Generator Run Displaced</span>
                  <span className="value" style={{ color: 'hsl(var(--color-solar))' }}>{displacedGenHours} hrs/day</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="12" 
                  step="0.5"
                  value={displacedGenHours} 
                  onChange={(e) => setDisplacedGenHours(parseFloat(e.target.value))} 
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>Displacing ~{Math.round(displacedGenHours * 1.2 * 30.4)} L/mo</span>
                  <strong style={{ color: '#10b981' }}>+{econ.symbol}{monthlyFuelSavings.toLocaleString()}/mo saved</strong>
                </div>
              </div>
            )}

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
                Fits up to {maxPanelsOnRoof} solar panels physically.
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
                <span>⚠️ Roof Area Constrained: Your roof space limits maximum system sizing to {recommendedSystemSizeKw} kW, covering {finalOffsetPercentage}% of your utility demand.</span>
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
        <div className="premium-card grid-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>25-Year Cumulative Cashflow</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Comparison of cumulative capital outflow with vs. without solar</p>
            </div>
            <div style={{ display: 'flex', gap: '14px', fontSize: '0.82rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.7)' }}></span>
                Utility Only
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.7)' }}></span>
                With Solar
              </span>
            </div>
          </div>

          {/* Interactive Chart Canvas */}
          <div style={{ position: 'relative', width: '100%', height: '240px', padding: '10px 0', overflow: 'hidden' }}>
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
                    L 30,${170 - (cashflowData[0].utilityOnly / chartMax) * 150} 
                    L 120,${170 - (cashflowData[5].utilityOnly / chartMax) * 150} 
                    L 210,${170 - (cashflowData[10].utilityOnly / chartMax) * 150} 
                    L 300,${170 - (cashflowData[15].utilityOnly / chartMax) * 150} 
                    L 390,${170 - (cashflowData[20].utilityOnly / chartMax) * 150} 
                    L 478,${170 - (cashflowData[24].utilityOnly / chartMax) * 150}
                    L 478,170 Z`}
                fill="url(#utilityGlowGrad)"
                className="chart-area-fade"
              />

              {/* With Solar Area Shader */}
              <path
                d={`M 30,${170 - (cashflowData[0].withSolar / chartMax) * 150} 
                    L 120,${170 - (cashflowData[5].withSolar / chartMax) * 150} 
                    L 210,${170 - (cashflowData[10].withSolar / chartMax) * 150} 
                    L 300,${170 - (cashflowData[15].withSolar / chartMax) * 150} 
                    L 390,${170 - (cashflowData[20].withSolar / chartMax) * 150} 
                    L 478,${170 - (cashflowData[24].withSolar / chartMax) * 150}
                    L 478,170
                    L 30,170 Z`}
                fill="url(#solarRoiGlowGrad)"
                className="chart-area-fade"
              />

              {/* Utility only climb curve (No Solar) */}
              <path
                d={`M 30,170 
                    L 30,${170 - (cashflowData[0].utilityOnly / chartMax) * 150} 
                    L 120,${170 - (cashflowData[5].utilityOnly / chartMax) * 150} 
                    L 210,${170 - (cashflowData[10].utilityOnly / chartMax) * 150} 
                    L 300,${170 - (cashflowData[15].utilityOnly / chartMax) * 150} 
                    L 390,${170 - (cashflowData[20].utilityOnly / chartMax) * 150} 
                    L 478,${170 - (cashflowData[24].utilityOnly / chartMax) * 150}`}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="chart-line-draw"
              />

              {/* With Solar Curve */}
              <path
                d={`M 30,${170 - (cashflowData[0].withSolar / chartMax) * 150} 
                    L 120,${170 - (cashflowData[5].withSolar / chartMax) * 150} 
                    L 210,${170 - (cashflowData[10].withSolar / chartMax) * 150} 
                    L 300,${170 - (cashflowData[15].withSolar / chartMax) * 150} 
                    L 390,${170 - (cashflowData[20].withSolar / chartMax) * 150} 
                    L 478,${170 - (cashflowData[24].withSolar / chartMax) * 150}`}
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
                const yUtility = 170 - (data.utilityOnly / chartMax) * 150;
                const ySolar = 170 - (data.withSolar / chartMax) * 150;

                return (
                  <g 
                    key={year} 
                    style={{ cursor: 'pointer' }} 
                    onMouseEnter={() => setSelectedYearPoint({ year, ...data, index: idx })}
                    onClick={() => setSelectedYearPoint(prev => prev?.year === year ? null : { year, ...data, index: idx })}
                    onTouchStart={() => setSelectedYearPoint({ year, ...data, index: idx })}
                  >
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
              <div 
                className="chart-floating-tooltip"
                style={{
                  position: 'absolute',
                  top: '20px',
                  left: `${Math.min(75, Math.max(25, 20 + selectedYearPoint.index * 13))}%`,
                  transform: 'translateX(-50%)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 10,
                  fontSize: '0.8rem',
                  minWidth: '160px',
                  maxWidth: 'calc(100vw - 48px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '2px', color: 'var(--text-primary)' }}>
                  <span>Cumulative: Year {selectedYearPoint.year}</span>
                  <button 
                    onClick={() => setSelectedYearPoint(null)} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px', padding: '0 2px' }}
                    aria-label="Close tooltip"
                  >✕</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f43f5e', fontWeight: 600 }}>
                  <span>Utility Only:</span>
                  <span>{econ.symbol}{selectedYearPoint.utilityOnly.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 600 }}>
                  <span>With Solar:</span>
                  <span>{econ.symbol}{selectedYearPoint.withSolar.toLocaleString()}</span>
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
                  <span>{selectedYearPoint.netSavings >= 0 ? `${econ.symbol}${selectedYearPoint.netSavings.toLocaleString()}` : `-${econ.symbol}${Math.abs(selectedYearPoint.netSavings).toLocaleString()}`}</span>
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
              <strong>{econ.symbol}{Math.round(grossCost).toLocaleString()}</strong>
            </div>
            
            {federalItcDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--color-gen))', fontWeight: 600 }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {itcLabel} <Percent size={12} />
                </span>
                <span>-{econ.symbol}{Math.round(federalItcDiscount).toLocaleString()}</span>
              </div>
            )}

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
              <span>{econ.symbol}{Math.round(netSystemCost).toLocaleString()}</span>
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
              <strong>{econ.symbol}{Math.round(annualSavingsYear1).toLocaleString()} / yr</strong>
            </div>

            {econ.hasGeneratorOffset && annualFuelSavings > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Generator Fuel Offset</span>
                <strong>+{econ.symbol}{Math.round(annualFuelSavings).toLocaleString()} / yr</strong>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Projected Payback</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Break-even: {breakEvenYear ? `Year ${breakEvenYear}` : '>25 Years'}</span>
              </div>
              <strong style={{ 
                backgroundColor: paybackPeriodYears <= 7 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                color: paybackPeriodYears <= 7 ? '#059669' : '#d97706',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                {paybackPeriodYears} Years (Simple)
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
              <span>{econ.symbol}{lifetimeSavings25Years.toLocaleString()}</span>
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
            <p>✓ 25-Year Production Guarantee: Solar panels are warrantied to retain at least 85.5% of original power capacity in Year 25.</p>
            <p>✓ Inverter Lifecycle: Modern grid-tie microinverters carry a 15–25 year warranty. A central inverter buffer is calculated in Year 12 projections.</p>
            <p>✓ Property Appreciation: Residential solar installations typically raise local appraisal values. Verify with a local agent for your market.</p>
            {isNorthAmerica && <p style={{ color: '#f59e0b', fontSize: '0.75rem' }}>Note: {itcNote}</p>}
            {!isNorthAmerica && <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{itcNote}</p>}
          </div>
        </div>

      </div>

    </div>
  );
}
