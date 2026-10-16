/**
 * Region profiles: currency, default tariff, default installed cost and incentive notes.
 *
 * IMPORTANT: every number here is a PLANNING DEFAULT, not a quote. The Calculator and
 * Estimator expose tariff and cost as editable inputs and label them as assumptions.
 * Replace them with a real utility bill and an installer quote.
 *
 * Costs/tariffs are stored in the profile's own currency so the app never silently
 * mixes USD figures into a Naira (or Euro) user's results.
 */

const NGN = {
  currency: 'NGN',
  locale: 'en-NG',
  // Assumption: roughly the NERC "Band A" residential tariff level. Bands B-E are lower; edit to match your bill.
  gridRate: 209.5,
  // Assumption: indicative turnkey cost per installed watt incl. inverter/mounting (excl. battery). Get a local quote.
  costPerWatt: 1500,
  // Assumption: typical petrol-generator electricity cost per kWh, shown only as a comparison.
  generatorRate: 700,
  incentiveRate: 0,
  incentiveLabel: 'Incentive / duty relief',
  incentiveNote:
    'No national residential solar tax credit is assumed. Import-duty and VAT treatment of solar equipment changes; confirm with your installer or customs agent.',
  areaUnit: 'm2',
  tariffEscalation: 0.08,
  // Why 8%: Nigerian tariffs have risen sharply since 2024; adjust to your own expectation.
};

const USD = {
  currency: 'USD',
  locale: 'en-US',
  gridRate: 0.16,
  costPerWatt: 3.1,
  generatorRate: 0.5,
  // The US residential clean-energy credit (IRC section 25D) does not apply to expenditures after 31 Dec 2025
  // (July 2025 budget law). It is therefore NOT applied by default. State/utility incentives may still exist.
  incentiveRate: 0,
  incentiveLabel: 'State / utility incentive',
  incentiveNote:
    'The 30% federal residential credit (25D) ended for spending after 2025, so it is not applied. Enter a percentage below if your state, utility or lease structure offers an incentive.',
  areaUnit: 'sqft',
  tariffEscalation: 0.03,
};

const EUR = {
  currency: 'EUR',
  locale: 'en-IE',
  gridRate: 0.28,
  costPerWatt: 1.6,
  generatorRate: 0.6,
  incentiveRate: 0,
  incentiveLabel: 'Incentive / grant',
  incentiveNote: 'Incentives vary by country and change often. Enter a percentage below if you have confirmed one.',
  areaUnit: 'm2',
  tariffEscalation: 0.03,
};

const GENERIC = {
  ...USD,
  areaUnit: 'm2',
  incentiveNote:
    'Placeholder USD defaults are used for this zone. Replace the tariff and installed cost with local figures; enter an incentive percentage if you have a confirmed one.',
};

const PROFILE_BY_ZONE = {
  'West Africa': NGN,
  'Southern Europe': EUR,
  'Western Europe': EUR,
  'Northern Europe': EUR,
  'Central & Eastern Europe': EUR,
  'North America - Sun Belt': USD,
  'North America - Central & East': USD,
  'North America - Northwest & Canada': USD,
};

export const getRegionProfile = (zoneValue) => ({ ...(PROFILE_BY_ZONE[zoneValue] || GENERIC) });

export const SQM_PER_SQFT = 0.09290304;
export const PANEL_WATTS = 400;
// ~1.75 m2 is typical for a modern 400 W module (about 18.8 sq ft).
export const PANEL_AREA_M2 = 1.75;

export const formatCurrency = (amount, profile, { compact = false } = {}) => {
  const value = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(profile.locale, {
    style: 'currency',
    currency: profile.currency,
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(value);
};

export const formatRate = (rate, profile) =>
  new Intl.NumberFormat(profile.locale, {
    style: 'currency',
    currency: profile.currency,
    minimumFractionDigits: profile.gridRate < 5 ? 2 : 0,
    maximumFractionDigits: profile.gridRate < 5 ? 2 : 1,
  }).format(rate);

export const areaToDisplay = (areaM2, profile) =>
  profile.areaUnit === 'sqft' ? Math.round(areaM2 / SQM_PER_SQFT) : Math.round(areaM2);
export const areaFromDisplay = (value, profile) => (profile.areaUnit === 'sqft' ? value * SQM_PER_SQFT : value);
export const areaUnitLabel = (profile) => (profile.areaUnit === 'sqft' ? 'sq ft' : 'm²');
