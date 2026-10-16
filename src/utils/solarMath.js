/**
 * Pure solar planning maths. No React, no DOM - everything here is unit-tested
 * (see solarMath.test.js) and shared by Calculator, Estimator, Orientation and Dashboard
 * so that every screen agrees with every other screen.
 *
 * These are PLANNING approximations, not bankable yield simulations. For financing
 * decisions use a tool such as PVGIS or NREL PVWatts and an installer's site survey.
 */

export const PERFORMANCE_RATIO = 0.8; // inverter, wiring, soiling and temperature losses combined
export const DEFAULT_DEGRADATION = 0.005; // 0.5 % / year, a typical warranty-level figure
export const BATTERY_MODULE_KWH = 5.12; // common 48 V LiFePO4 rack module (nameplate)
export const BATTERY_DOD = 0.9; // usable fraction of nameplate capacity
export const LOAD_DIVERSITY = 0.6; // not every appliance runs at its nameplate watts simultaneously

const round = (value, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/* --------------------------------- sizing --------------------------------- */

export const applianceDailyKwh = (app) => ((app.watts || 0) * (app.hours || 0) * (app.qty || 0)) / 1000;

export const totalDailyKwh = (appliances) => appliances.reduce((sum, app) => sum + applianceDailyKwh(app), 0);

/** Array size needed to cover `dailyKwh` given local peak-sun-hours. */
export const sizeSystem = ({ dailyKwh, sunHours, performanceRatio = PERFORMANCE_RATIO, panelWatts = 400 }) => {
  if (!(dailyKwh > 0) || !(sunHours > 0)) return { systemKw: 0, panelCount: 0 };
  const systemKw = round(dailyKwh / (sunHours * performanceRatio), 1);
  const panelCount = Math.ceil((systemKw * 1000) / panelWatts);
  return { systemKw, panelCount };
};

export const annualGenerationKwh = (systemKw, sunHours, performanceRatio = PERFORMANCE_RATIO) =>
  systemKw * sunHours * 365 * performanceRatio;

/* ------------------------- loads, inverter, battery ------------------------ */

/**
 * Average electrical load of a set of appliances, adjusted for duty cycle:
 * a 150 W fridge running 24 h is 150 W; a 1.2 kW microwave used 30 min a day averages 25 W.
 * This is what actually drains a battery over an outage - NOT the sum of nameplate watts.
 */
export const averageLoadKw = (appliances) =>
  appliances.reduce((sum, app) => {
    const hours = clamp(app.hours || 0, 0, 24);
    return sum + (((app.watts || 0) * (app.qty || 0) * hours) / 24) / 1000;
  }, 0);

/** Realistic simultaneous peak: diversified sum, never below the single largest load. */
export const peakLoadKw = (appliances, diversity = LOAD_DIVERSITY) => {
  const active = appliances.filter((app) => (app.hours || 0) > 0);
  if (active.length === 0) return 0;
  const watts = active.map((app) => (app.watts || 0) * (app.qty || 0));
  const total = watts.reduce((a, b) => a + b, 0);
  return Math.max(Math.max(...watts), total * diversity) / 1000;
};

const MOTOR_CATEGORIES = ['Kitchen', 'HVAC', 'Laundry'];

/** Surge: diversified running load plus the extra inrush of the biggest motor-type appliance (~3x running watts). */
export const surgeKw = (appliances, { motorFactor = 3 } = {}) => {
  const running = peakLoadKw(appliances);
  const motors = appliances
    .filter((app) => MOTOR_CATEGORIES.includes(app.category) && (app.hours || 0) > 0)
    .map((app) => (app.watts || 0) * (app.qty || 0));
  if (motors.length === 0) return running;
  return running + (Math.max(...motors) * (motorFactor - 1)) / 1000;
};

export const recommendInverterKw = (peakKw) => Math.max(3, Math.ceil((peakKw * 1.25) / 0.5) * 0.5);

/**
 * Battery sizing for backing up `criticalDailyKwh` for `outageHours`.
 * 1.25 = margin for round-trip losses, ageing and a reserve.
 */
export const recommendBattery = ({ criticalDailyKwh, outageHours = 18 }) => {
  if (!(criticalDailyKwh > 0)) return { requiredKwh: 0, modules: 0, nominalKwh: 0, usableKwh: 0 };
  const requiredKwh = round(criticalDailyKwh * (outageHours / 24) * 1.25, 1);
  const modules = Math.max(1, Math.ceil(requiredKwh / (BATTERY_MODULE_KWH * BATTERY_DOD)));
  const nominalKwh = round(modules * BATTERY_MODULE_KWH, 2);
  return { requiredKwh, modules, nominalKwh, usableKwh: round(nominalKwh * BATTERY_DOD, 2) };
};

/** Energy still available above the protected reserve floor. */
export const availableKwh = ({ nominalKwh, socPct, dod = BATTERY_DOD }) =>
  Math.max(0, nominalKwh * (socPct / 100 - (1 - dod)));

/** Hours of backup at a constant load. Uses the SAME model as {@link drainSoc}. */
export const backupHours = ({ nominalKwh, socPct, loadKw, dod = BATTERY_DOD }) => {
  if (!(loadKw > 0)) return Infinity;
  return availableKwh({ nominalKwh, socPct, dod }) / loadKw;
};

/** One simulation step of battery drain, physically tied to nominal capacity. */
export const drainSoc = ({ socPct, loadKw, dtHours, nominalKwh, dod = BATTERY_DOD }) => {
  if (!(nominalKwh > 0) || !(loadKw > 0)) return socPct;
  const floor = (1 - dod) * 100;
  const next = socPct - ((loadKw * dtHours) / nominalKwh) * 100;
  return Math.max(floor, next);
};

/** Dashboard battery integration. Accepts either an options object or positional arguments, guarding against NaN. */
export const stepBattery = (arg, netKwArg, capacityKwhArg, dtHoursArg) => {
  let socPct, netKw, capacityKwh, dtHours;
  if (typeof arg === 'object' && arg !== null) {
    ({ socPct, netKw, capacityKwh, dtHours } = arg);
  } else {
    socPct = arg;
    netKw = netKwArg;
    capacityKwh = capacityKwhArg;
    dtHours = typeof dtHoursArg === 'number' ? dtHoursArg : 0.025;
  }
  const capacity = Number.isFinite(capacityKwh) && capacityKwh > 0 ? capacityKwh : 13.5;
  const currentSoc = Number.isFinite(socPct) ? socPct : 68;
  const deltaHours = Number.isFinite(dtHours) ? dtHours : 0.025;
  const power = Number.isFinite(netKw) ? netKw : 0;
  const kwh = (currentSoc / 100) * capacity + power * deltaHours;
  const nextSoc = clamp((kwh / capacity) * 100, 0, 100);
  return Number.isFinite(nextSoc) ? round(nextSoc, 1) : 68;
};

/* --------------------------------- finance -------------------------------- */

/**
 * Year-by-year projection. Payback and the chart are both derived from this one
 * calculation, so they cannot disagree.
 *
 * Conservative: surplus generation earns no export credit (many grids have none).
 */
export const buildCashflow = ({
  upfrontCost,
  annualConsumptionKwh,
  year1GenerationKwh,
  tariff,
  tariffEscalation = 0.03,
  degradation = DEFAULT_DEGRADATION,
  annualOmCost = 0,
  inverterReplacementCost = 0,
  inverterReplacementYear = 12,
  years = 25,
}) => {
  const rows = [];
  let utilityOnlyCumulative = 0;
  let withSolarCumulative = upfrontCost;
  let paybackYears = null;
  let previousNetCumulative = -upfrontCost;
  let year1Savings = 0;

  for (let year = 1; year <= years; year += 1) {
    const rate = tariff * (1 + tariffEscalation) ** (year - 1);
    const generation = year1GenerationKwh * (1 - degradation) ** (year - 1);
    const selfConsumed = Math.min(generation, annualConsumptionKwh);

    const billWithoutSolar = annualConsumptionKwh * rate;
    const residualBill = (annualConsumptionKwh - selfConsumed) * rate;
    const costs = annualOmCost + (year === inverterReplacementYear ? inverterReplacementCost : 0);
    const savings = selfConsumed * rate;
    if (year === 1) year1Savings = savings;

    utilityOnlyCumulative += billWithoutSolar;
    withSolarCumulative += residualBill + costs;

    const netCumulative = utilityOnlyCumulative - withSolarCumulative;
    if (paybackYears === null && netCumulative >= 0) {
      const yearNet = netCumulative - previousNetCumulative;
      paybackYears = year - 1 + (yearNet > 0 ? -previousNetCumulative / yearNet : 0);
    }
    previousNetCumulative = netCumulative;

    rows.push({
      year,
      rate,
      generationKwh: generation,
      savings,
      costs,
      utilityOnly: utilityOnlyCumulative,
      withSolar: withSolarCumulative,
      netSavings: netCumulative,
    });
  }

  return {
    rows,
    year1Savings,
    paybackYears: paybackYears === null ? null : round(paybackYears, 1),
    lifetimeNet: rows[rows.length - 1].netSavings,
  };
};

/* ------------------------------ orientation ------------------------------- */

export const optimalAzimuth = (latitude) => (latitude < 0 ? 'North' : 'South');

/**
 * Best fixed tilt ~ |latitude|, but never below ~8 degrees so rain can self-clean the panel.
 * Without a location we assume a tropical default (~10 degrees).
 */
export const optimalTilt = (latitude) => (Number.isFinite(latitude) ? clamp(Math.round(Math.abs(latitude)), 8, 50) : 10);

/**
 * Relative annual yield (0-100 %) for a fixed roof plane. Hemisphere-aware and tilt-aware:
 * azimuth matters less on a nearly flat roof and near the equator.
 * Approximate planning index - not a simulation.
 */
export const orientationEfficiency = ({ azimuth, tilt, latitude }) => {
  const bestAzimuth = optimalAzimuth(Number.isFinite(latitude) ? latitude : 0);
  const worstAzimuth = bestAzimuth === 'South' ? 'North' : 'South';
  const bestTilt = optimalTilt(latitude);

  // How strongly azimuth affects yield: grows with tilt and with distance from the equator.
  const tiltInfluence = clamp(Math.sin((tilt * Math.PI) / 180) / Math.sin(Math.PI / 6), 0, 1.4);
  const latInfluence = clamp(0.6 + (Math.abs(Number.isFinite(latitude) ? latitude : 0) / 35) * 0.4, 0.6, 1);
  const influence = tiltInfluence * latInfluence;

  let azimuthLoss = 0;
  if (azimuth === 'East' || azimuth === 'West') azimuthLoss = 0.14 * influence;
  else if (azimuth === worstAzimuth) azimuthLoss = 0.35 * influence;
  else if (azimuth !== bestAzimuth) azimuthLoss = 0.05 * influence;

  const tiltDeviation = Math.abs(tilt - bestTilt);
  const tiltLoss = Math.min(0.45, 0.0001 * tiltDeviation ** 2);

  return clamp(Math.round((1 - azimuthLoss) * (1 - tiltLoss) * 100), 25, 100);
};

/* ------------------------------ dashboard sim ------------------------------ */

/** Simulated PV output (kW) for a clock hour (0-24) and cloud cover (0-100 %). */
export const simulatedSolarKw = ({ hour, cloudCover, arrayKw = 6.5 }) => {
  if (hour < 6 || hour > 18) return 0;
  const sun = Math.sin(((hour - 6) * Math.PI) / 12);
  const cloudFactor = (100 - clamp(cloudCover, 0, 100) * 0.75) / 100;
  return round(Math.max(0, arrayKw * sun * cloudFactor), 2);
};

/** Illustrative UV index for the simulator, labelled with the WHO bands. */
export const uvLabel = (uv) => {
  if (uv >= 11) return 'Extreme';
  if (uv >= 8) return 'Very High';
  if (uv >= 6) return 'High';
  if (uv >= 3) return 'Moderate';
  return 'Low';
};
