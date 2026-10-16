import { describe, it, expect } from 'vitest';
import {
  sizeSystem,
  annualGenerationKwh,
  averageLoadKw,
  peakLoadKw,
  surgeKw,
  recommendInverterKw,
  recommendBattery,
  availableKwh,
  backupHours,
  drainSoc,
  stepBattery,
  buildCashflow,
  optimalAzimuth,
  optimalTilt,
  orientationEfficiency,
  simulatedSolarKw,
  uvLabel
} from './solarMath';

describe('solarMath module', () => {
  it('correctly sizes solar array and panel count', () => {
    // 30 kWh/day with 5 sun hours and 0.8 PR -> 30 / 4 = 7.5 kW -> 19 panels of 400W
    const { systemKw, panelCount } = sizeSystem({ dailyKwh: 30, sunHours: 5 });
    expect(systemKw).toBe(7.5);
    expect(panelCount).toBe(19);

    const zero = sizeSystem({ dailyKwh: 0, sunHours: 5 });
    expect(zero.systemKw).toBe(0);
    expect(zero.panelCount).toBe(0);
  });

  it('calculates annual generation with performance ratio', () => {
    // 7.5 kW * 5.4 * 365 * 0.8
    const kwh = annualGenerationKwh(7.5, 5.4, 0.8);
    expect(Math.round(kwh)).toBe(11826);
  });

  it('calculates duty-cycle average load and diversified peak', () => {
    const appliances = [
      { watts: 150, hours: 24, qty: 1, category: 'Kitchen' }, // fridge: 150W average
      { watts: 1200, hours: 0.5, qty: 1, category: 'Kitchen' }, // microwave: 25W average
      { watts: 1500, hours: 6, qty: 1, category: 'HVAC' } // AC: 375W average
    ];
    const avg = averageLoadKw(appliances);
    expect(Math.round(avg * 1000)).toBe(550); // 150 + 25 + 375 = 550W

    const peak = peakLoadKw(appliances);
    // Total is 150 + 1200 + 1500 = 2850W. Diversified at 0.6 is 1710W. Max single is 1500W.
    expect(peak).toBe(1.71);
  });

  it('calculates surge load with motor starting factor and inverter sizing', () => {
    const appliances = [
      { watts: 1500, hours: 6, qty: 1, category: 'HVAC' } // motor appliance
    ];
    const surge = surgeKw(appliances, { motorFactor: 3 });
    expect(surge).toBeGreaterThan(1.5);

    const inverter = recommendInverterKw(2.5);
    expect(inverter).toBeGreaterThanOrEqual(3.0);
  });

  it('recommends battery capacity and modules accurately', () => {
    const rec = recommendBattery({ criticalDailyKwh: 10, outageHours: 18 });
    expect(rec.requiredKwh).toBeGreaterThan(0);
    expect(rec.modules).toBeGreaterThanOrEqual(1);
    expect(rec.nominalKwh).toBeGreaterThan(0);
  });

  it('calculates backup hours and battery drain simulation', () => {
    expect(availableKwh({ nominalKwh: 10, socPct: 100, dod: 0.9 })).toBe(9);
    const hours = backupHours({ nominalKwh: 13.5, socPct: 100, loadKw: 1.0, dod: 0.9 });
    // Usable is 13.5 * (1 - 0.1) = 12.15 kWh -> 12.15 hours at 1 kW
    expect(Math.round(hours * 10) / 10).toBe(12.2);

    const nextSoc = drainSoc({ socPct: 100, loadKw: 1.0, dtHours: 1, nominalKwh: 10, dod: 0.9 });
    // 1 kWh drained from 10 kWh nominal is 10%
    expect(nextSoc).toBe(90);

    const batteryStep = stepBattery({ socPct: 50, netKw: 2.0, capacityKwh: 10, dtHours: 1 });
    // 5 kWh + 2 kWh = 7 kWh -> 70%
    expect(batteryStep).toBe(70);
  });

  it('builds coherent cashflow with degradation and payback agreement', () => {
    const cashflow = buildCashflow({
      upfrontCost: 10000,
      annualConsumptionKwh: 6000,
      year1GenerationKwh: 7000,
      tariff: 0.20,
      tariffEscalation: 0.04,
      degradation: 0.005,
      years: 25
    });

    expect(cashflow.rows).toHaveLength(25);
    expect(cashflow.year1Savings).toBe(1200);
    expect(cashflow.paybackYears).toBeDefined();
    expect(typeof cashflow.paybackYears).toBe('number');
  });

  it('evaluates hemisphere-aware azimuth and optimal tilt', () => {
    expect(optimalAzimuth(6.5)).toBe('South'); // Lagos 6.5°N
    expect(optimalAzimuth(-33.9)).toBe('North'); // Cape Town 33.9°S

    expect(optimalTilt(6.5)).toBe(8); // min 8°
    expect(optimalTilt(51.5)).toBe(50); // clamp at 50°

    // Orientation efficiency in Southern Hemisphere: North is best, South is worst
    const southHemiNorth = orientationEfficiency({ azimuth: 'North', tilt: 30, latitude: -30 });
    const southHemiSouth = orientationEfficiency({ azimuth: 'South', tilt: 30, latitude: -30 });
    expect(southHemiNorth).toBeGreaterThan(southHemiSouth);
  });

  it('simulates solar output and provides valid UV index labels', () => {
    const night = simulatedSolarKw({ hour: 2, cloudCover: 20, arrayKw: 6.5 });
    expect(night).toBe(0);

    const midday = simulatedSolarKw({ hour: 12, cloudCover: 0, arrayKw: 6.5 });
    expect(midday).toBe(6.5);

    expect(uvLabel(1)).toBe('Low');
    expect(uvLabel(4)).toBe('Moderate');
    expect(uvLabel(7)).toBe('High');
    expect(uvLabel(9)).toBe('Very High');
    expect(uvLabel(12)).toBe('Extreme');
  });
});
