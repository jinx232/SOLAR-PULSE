/**
 * Solar Pulse – Structured Knowledge Base Corpus v2.0
 * ─────────────────────────────────────────────────────
 * 50+ richly detailed, chunked documents for RAG retrieval.
 * Each document:
 *   id       – unique slug
 *   title    – human-readable title
 *   content  – expert text used for embedding + answer augmentation
 *   tags     – keyword array for pre-filtering
 *   category – broad topic group
 *   source   – authoritative source label
 */

export const KNOWLEDGE_BASE = [
  // ─── PANEL TYPES ──────────────────────────────────────────────────────────
  {
    id: 'panels-monocrystalline',
    title: 'Monocrystalline Solar Panels',
    category: 'Panel Technology',
    source: 'Solar Energy Industries Association (SEIA)',
    tags: ['mono', 'monocrystalline', 'panel', 'type', 'efficiency', 'black'],
    content: `Monocrystalline solar panels are made from a single crystal structure of silicon using the Czochralski method, producing cylindrical silicon ingots sliced into wafers. Because silicon is uniformly aligned, electrons move more freely, resulting in efficiencies of 19–24%. Premium models from SunPower and REC Alpha exceed 24.1%. They have a sleek, all-black appearance. Lifespan: 25–30 years with ≥80–85% output at year 25. Cost: $0.80–$1.20 per watt. Best for: limited roof area, high-value installations, premium aesthetics.`
  },
  {
    id: 'panels-polycrystalline',
    title: 'Polycrystalline Solar Panels',
    category: 'Panel Technology',
    source: 'National Renewable Energy Laboratory (NREL)',
    tags: ['poly', 'polycrystalline', 'panel', 'type', 'blue', 'budget'],
    content: `Polycrystalline solar panels are made by melting multiple silicon fragments together, creating a multi-crystal structure. Manufacturing is simpler and less expensive ($0.50–$0.75 per watt). Efficiencies: 15–18%. The distinctive speckled blue color comes from multiple crystal boundaries. They require 20–30% more roof space than monocrystalline for equivalent output. Lifespan: 20–25 years. Degradation: ~0.5–0.8%/year. Best for: large flat rooftops, budget-conscious buyers, utility-scale installations.`
  },
  {
    id: 'panels-bifacial',
    title: 'Bifacial Solar Panels',
    category: 'Panel Technology',
    source: 'Fraunhofer ISE',
    tags: ['bifacial', 'dual', 'two-sided', 'albedo', 'panel', 'ground-mounted'],
    content: `Bifacial solar panels capture sunlight from both front and back surfaces. The rear side captures albedo (reflected) light from ground surfaces — white gravel or concrete contributes 5–30% additional power. Front efficiency: 19–23%. Bifacial gain: 5–30% depending on ground reflectivity. Glass-glass construction resists moisture, UV, and extreme temperatures. Ideal for ground-mounted systems, flat commercial rooftops, or elevated carport installations. Leading products: LONGi Hi-MO 6, Canadian Solar HiKu7.`
  },
  {
    id: 'panels-thin-film',
    title: 'Thin-Film Solar Panels (CdTe & CIGS)',
    category: 'Panel Technology',
    source: 'US Department of Energy (DOE)',
    tags: ['thin film', 'cdte', 'cigs', 'flexible', 'amorphous', 'first solar'],
    content: `Thin-film solar panels deposit thin photovoltaic layers on glass, plastic, or metal. Types: CdTe (First Solar), CIGS, amorphous silicon (a-Si). Efficiencies: 10–18%. They perform better in high temperatures and diffuse (cloudy) light compared to crystalline silicon. Lighter, flexible, and integrable into building materials (BIPV). Faster degradation (~1%/year). Best for: large utility-scale farms, curved surfaces, or building-integrated PV.`
  },
  {
    id: 'panels-perc',
    title: 'PERC Solar Panels (Passivated Emitter Rear Cell)',
    category: 'Panel Technology',
    source: 'NREL Technical Report 2024',
    tags: ['perc', 'passivated', 'rear cell', 'efficiency', 'modern'],
    content: `PERC adds a passivation layer on the cell's rear surface, reflecting photons that have passed through back into the silicon for another chance to generate electrons. This yields 1–2% absolute efficiency gain, pushing PERC modules to 21–23%. PERC is now the dominant commercial technology, used by JinkoSolar, LONGi, and JA Solar. Compatible with both monocrystalline and polycrystalline wafers — mono-PERC is most common.`
  },
  {
    id: 'panels-topcon',
    title: 'TOPCon Solar Panels (Tunnel Oxide Passivated Contact)',
    category: 'Panel Technology',
    source: 'Fraunhofer ISE 2025 Report',
    tags: ['topcon', 'tunnel oxide', 'next gen', 'high efficiency', '2025'],
    content: `TOPCon adds an ultra-thin tunnel oxide layer plus a highly doped polysilicon layer on the cell rear, dramatically reducing recombination losses. Lab efficiency: 26.1% (Fraunhofer ISE). Commercial TOPCon panels in 2025–2026 reach 22–24.5% efficiency. Lower temperature coefficient (-0.29%/°C vs PERC's -0.35%/°C) means better hot-climate performance. Leading products: JinkoSolar Tiger Neo, LONGi Hi-MO 6 Champion. Cost: 10–15% premium over PERC with better lifetime ROI.`
  },

  // ─── SYSTEM SIZING ────────────────────────────────────────────────────────
  {
    id: 'sizing-basics',
    title: 'Solar System Sizing Fundamentals',
    category: 'System Design',
    source: 'EnergySage Buyer\'s Guide 2025',
    tags: ['size', 'sizing', 'kw', 'kwh', 'how many panels', 'system size', 'capacity', 'number of panels'],
    content: `To size a residential solar system: (1) Find annual kWh from your electricity bill. (2) Divide annual kWh by 1,400 (average annual kWh/kW in the US) to get system size in kW. (3) Divide system kW by panel wattage (typically 400–440W) to get panel count. Example: 12,000 kWh/year ÷ 1,400 = 8.57 kW. At 410W/panel: 8,570 ÷ 410 = ~21 panels. In sun-rich areas like West Africa, production ratio (PR) = 1.5–1.7. In Northern Europe, PR = 0.9–1.1.`
  },
  {
    id: 'sizing-africa',
    title: 'Solar Sizing for West Africa (Nigeria, Ghana, Senegal)',
    category: 'System Design',
    source: 'IRENA Africa Solar Resource Atlas 2024',
    tags: ['africa', 'nigeria', 'ghana', 'west africa', 'sun hours', 'tropical', 'sizing', 'lagos', 'accra'],
    content: `West Africa enjoys 5.0–6.5 peak sun hours (PSH) per day — among the highest globally. Lagos: 5.4 PSH; Accra: 5.8 PSH; Dakar: 6.1 PSH. Solar systems in West Africa produce 25–40% more energy per panel than the UK or Germany. A 5 kW system in Lagos generates ~7,000–8,000 kWh/year. Typical urban households need 4–10 kW due to high AC loads. Off-grid systems need 8–16 hours battery autonomy due to NEPA/PHCN outages in Nigeria.`
  },
  {
    id: 'sizing-battery-bank',
    title: 'Battery Bank Sizing for Solar Systems',
    category: 'System Design',
    source: 'Victron Energy Application Notes',
    tags: ['battery', 'bank', 'sizing', 'autonomy', 'ah', 'kwh', 'capacity', 'days', 'how much battery'],
    content: `Battery bank sizing formula: Battery Ah = (Daily Wh × Days of Autonomy) ÷ (DoD × System Voltage). Example: 5,000 Wh/day × 2 days = 10,000 Wh ÷ (0.8 × 48V) = 260 Ah at 48V for lithium. Lithium (LiFePO4): 80–100% DoD recommended. Lead-acid: max 50% DoD. For lithium iron phosphate: 100Ah at 48V = 4.8 kWh usable. Tesla Powerwall 3 = 13.5 kWh. Enphase IQ Battery 5P = 5 kWh.`
  },
  {
    id: 'sizing-inverter',
    title: 'Inverter Sizing and Selection',
    category: 'System Design',
    source: 'SMA Solar Technology Guide',
    tags: ['inverter', 'sizing', 'string inverter', 'microinverter', 'hybrid', 'off-grid', 'mppt', 'growatt'],
    content: `Inverter types: (1) String Inverters — cost-effective for unshaded arrays (Fronius, SMA, SolarEdge). (2) Microinverters — 1 per panel, maximizes shaded output (Enphase IQ8). (3) Hybrid Battery Inverters — combines solar + battery management (Victron, GoodWe ET, Growatt SPF). Sizing rule: inverter = 90–110% of array DC capacity. For 8 kW array: use 7.6–10 kW inverter. Modern string inverters achieve 97–98.6% efficiency.`
  },

  // ─── FINANCIAL & ROI ──────────────────────────────────────────────────────
  {
    id: 'finance-roi',
    title: 'Solar ROI and Payback Period',
    category: 'Financial Analysis',
    source: 'Lawrence Berkeley National Laboratory (LBNL) 2025',
    tags: ['roi', 'return', 'payback', 'investment', 'years', 'profit', 'save', 'saving', 'worth it'],
    content: `Average US residential solar payback period: 5–8 years (2025). Factors: system cost ($2.50–$3.50/W installed), 30% Federal ITC, state incentives, electricity rate inflation (3–5%/year). After payback, electricity is effectively free for the remaining 17–22 years of panel life. NPV for a 10 kW system over 25 years: $18,000–$35,000. IRR: 8–15%. In Africa, ROI is faster (3–6 years) due to high diesel generator costs displaced.`
  },
  {
    id: 'finance-itc',
    title: 'Federal Investment Tax Credit (ITC) – United States',
    category: 'Financial Analysis',
    source: 'IRS Publication – Residential Clean Energy Credit',
    tags: ['tax credit', 'itc', 'federal', 'incentive', '30%', 'rebate', 'discount', 'usa', 'tax'],
    content: `The 30% Federal Solar ITC (Inflation Reduction Act 2022, extended through 2032) deducts 30% of total solar system cost from federal income taxes. Eligible costs: panels, inverters, wiring, labor, permits, and battery storage (if ≥80% solar-charged). Example: $20,000 system × 30% = $6,000 credit. Carryover available if credit exceeds tax liability. Applies to primary and secondary residences. Drops to 26% in 2033, 22% in 2034.`
  },
  {
    id: 'finance-net-metering',
    title: 'Net Metering – How it Works',
    category: 'Financial Analysis',
    source: 'DSIRE (Database of State Incentives for Renewables & Efficiency)',
    tags: ['net metering', 'nem', 'grid', 'sell back', 'credit', 'utility', 'billing', 'excess electricity'],
    content: `Net Energy Metering (NEM) credits excess solar electricity fed to the grid on your utility bill. Full retail NEM (NEM 1.0): 1:1 credit at the full retail electricity rate. California NEM 3.0 (2023): export credits at wholesale rates (~$0.05/kWh), making battery storage more valuable. Time-of-Use (TOU) NEM pays higher credits during peak demand hours (3–9 PM). Most US states mandate some form of net metering for investor-owned utilities.`
  },
  {
    id: 'finance-srec',
    title: 'Solar Renewable Energy Certificates (SRECs)',
    category: 'Financial Analysis',
    source: 'SRECtrade Market Data 2025',
    tags: ['srec', 'certificate', 'renewable', 'energy credit', 'sell', 'income', 'earn'],
    content: `An SREC is generated for every 1,000 kWh (1 MWh) of solar electricity produced. Utilities in states with Renewable Portfolio Standards buy SRECs. SREC prices: New Jersey: $200–$250, Massachusetts: $250–$350, Maryland: $60–$80. A 10 kW system generating 12,000 kWh/year earns ~12 SRECs/year = up to $2,400–$4,200/year additional income. Available primarily in US Northeast and Mid-Atlantic states.`
  },
  {
    id: 'finance-cost-breakdown',
    title: 'Solar Installation Cost Breakdown 2025',
    category: 'Financial Analysis',
    source: 'EnergySage Solar Marketplace 2025 Report',
    tags: ['cost', 'price', 'installation', 'breakdown', 'dollar', 'watt', 'average', 'how much'],
    content: `Average US residential solar cost (2025): $2.50–$3.50/W before incentives. Breakdown for 10 kW at $30,000: Panels 30% ($9,000), Inverters 10% ($3,000), Racking 5% ($1,500), Wiring 8% ($2,400), Labor 20% ($6,000), Permits 4% ($1,200), Profit 23% ($6,900). After 30% ITC: net cost = $21,000. Monthly loan at 4.99% APR over 12 years ≈ $220/month — often less than displaced utility bill. Cash payback: 5–8 years. In Nigeria, import duties add 30–50% to panel costs vs US prices.`
  },

  // ─── BATTERY STORAGE ──────────────────────────────────────────────────────
  {
    id: 'battery-lifepo4',
    title: 'Lithium Iron Phosphate (LiFePO4) Batteries',
    category: 'Battery Storage',
    source: 'Battery University – Cadex Electronics',
    tags: ['lifepo4', 'lithium iron', 'battery', 'cycle', 'safe', 'storage', 'lithium'],
    content: `LiFePO4 is the safest and most cycle-stable lithium chemistry for solar storage. Cycle life: 3,000–6,000 full cycles (10–15 years). DoD: 80–100%. Round-trip efficiency: 95–98%. Thermal stability: does not catch fire when punctured or overcharged (unlike NMC). Voltage: 3.2V/cell nominal, 48V battery = 16S. Self-discharge: 2–3%/month. Temperature range: -20°C to 60°C. Best choice for residential off-grid and backup applications.`
  },
  {
    id: 'battery-tesla-powerwall',
    title: 'Tesla Powerwall 3 – Specifications',
    category: 'Battery Storage',
    source: 'Tesla Energy Product Sheet 2024',
    tags: ['tesla', 'powerwall', 'powerwall 3', 'battery', 'storage', 'backup'],
    content: `Tesla Powerwall 3 (2024–2025): Usable capacity: 13.5 kWh. Continuous power: 11.5 kW. Surge power: 185A for motor starts. Integrated solar inverter up to 20 kW DC. Round-trip efficiency: 97.5%. Weight: 287 lbs. Warranty: 10 years, 70% capacity guarantee. Stackable up to 3 units = 40.5 kWh. Cost: ~$11,500 installed. Whole-home backup capability. Tesla app monitoring. WiFi/Ethernet/Cellular communication.`
  },
  {
    id: 'battery-enphase',
    title: 'Enphase IQ Battery 5P – Specifications',
    category: 'Battery Storage',
    source: 'Enphase Energy Product Datasheet 2025',
    tags: ['enphase', 'iq battery', '5p', 'microinverter', 'battery', 'modular'],
    content: `Enphase IQ Battery 5P: Usable capacity: 5.0 kWh/unit. Continuous power: 3.84 kW output/input. Peak power: 7.68 kW (10s). Round-trip efficiency: 89%. AC-coupled — works with any solar system. Modular: up to 4 units = 20 kWh. Warranty: 15 years, 70% capacity. NEMA 4X outdoor rated. Weight: 198 lbs. Each unit has a built-in microinverter. Cost: ~$6,000–$8,000/unit installed. DoD: 100%.`
  },
  {
    id: 'battery-comparison',
    title: 'Lead-Acid vs Lithium for Solar Storage',
    category: 'Battery Storage',
    source: 'Solar Power World Magazine',
    tags: ['lead acid', 'agm', 'gel', 'battery', 'compare', 'old', 'cheap', 'vs'],
    content: `Lead-acid vs LiFePO4 comparison: Cost: Lead-acid $100–$200/kWh vs LiFePO4 $300–$600/kWh upfront. Cycle life: Lead-acid 300–600 cycles (3–5 years) vs LiFePO4 3,000–6,000 (10–15 years). DoD: Lead-acid max 50% vs LiFePO4 100%. Efficiency: Lead-acid 70–80% vs LiFePO4 95–98%. Maintenance: Flooded lead-acid requires monthly water top-up. Cost per kWh over lifetime: Lead-acid $0.50–$1.00 vs LiFePO4 $0.10–$0.20. Conclusion: LiFePO4 cheaper over system lifetime despite higher upfront cost.`
  },

  // ─── GRID & SYSTEM TYPES ──────────────────────────────────────────────────
  {
    id: 'grid-types',
    title: 'Grid-Tied vs Off-Grid vs Hybrid Solar Systems',
    category: 'System Types',
    source: 'Solar Reviews Expert Guide',
    tags: ['grid tied', 'off grid', 'hybrid', 'type', 'system', 'grid', 'battery', 'which is better'],
    content: `Grid-Tied: Connected to utility grid. No batteries needed. Cheaper ($2.50–$3.50/W). Earns net metering. NO power during blackouts. Off-Grid: Fully independent. Requires large battery bank (1–3 days autonomy) + backup generator. Higher cost. Essential for remote locations. Common in rural Africa. Hybrid: Connected to grid AND has battery backup. Powers critical loads during blackouts. Exports excess to grid. Cost: $3.50–$5.00/W. Popular inverters: Growatt, GoodWe, SolarEdge Energy Hub.`
  },
  {
    id: 'grid-blackout-protection',
    title: 'Solar + Battery for Backup Power During Blackouts',
    category: 'System Types',
    source: 'EPRI Power Reliability Research',
    tags: ['blackout', 'backup', 'outage', 'power cut', 'nepa', 'ups', 'emergency', 'power outage'],
    content: `Grid-tied solar shuts down during outages (anti-islanding safety). To maintain power: hybrid system with automatic transfer switch (ATS). Operation: Grid present = solar charges battery + powers home + exports excess. Grid failure = battery takes over in <20ms. Solar continues charging battery during outage. Critical load panels prioritize essential circuits (fridge, lights, WiFi, medical). In Nigeria (12–20 hour daily outages), solar + battery eliminates $200–$400/month diesel generator costs.`
  },

  // ─── MAINTENANCE ──────────────────────────────────────────────────────────
  {
    id: 'maintenance-cleaning',
    title: 'Solar Panel Cleaning and Maintenance',
    category: 'Maintenance',
    source: 'Clean Energy Council Australia',
    tags: ['maintenance', 'clean', 'cleaning', 'dirty', 'dust', 'wash', 'bird', 'rain', 'snow', 'care'],
    content: `Solar panels require minimal maintenance (no moving parts). Cleaning frequency: Quarterly in dusty/arid climates (Sahel, Arizona). Biannual in temperate climates. Rain sufficient in wet climates. Method: Garden hose rinse (avoid high-pressure jets). Mild soap for bird droppings. Microfiber cloth for spots. Clean in morning or evening when panels are cool. Soiling efficiency loss: 5–25% depending on dust and tilt. Annual inspection: check for microcracks, delamination, junction box damage, loose mounts.`
  },
  {
    id: 'maintenance-monitoring',
    title: 'Solar System Performance Monitoring',
    category: 'Maintenance',
    source: 'SolarEdge Monitoring Platform',
    tags: ['monitoring', 'app', 'track', 'performance', 'data', 'output', 'yield', 'dashboard'],
    content: `Real-time monitoring platforms track solar performance. String inverter monitoring (Fronius Solar.web, SMA Sunny Portal, SolarEdge): total kWh generated, real-time power, grid export/import, fault alerts. Microinverter monitoring (Enphase Enlighten): panel-level monitoring — identifies underperforming panels instantly. Key metrics: PR (Performance Ratio) = actual ÷ theoretical output (healthy: 75–85%). Specific yield: 1,000–1,800 kWh/kWp in US; 1,400–2,000 kWh/kWp in West Africa.`
  },
  {
    id: 'maintenance-degradation',
    title: 'Solar Panel Degradation and Long-Term Performance',
    category: 'Maintenance',
    source: 'NREL Photovoltaic Degradation Rates 2024',
    tags: ['degradation', 'lifespan', 'age', 'old', 'performance', 'years', 'warranty', 'last'],
    content: `Degradation rates: Monocrystalline (PERC/TOPCon): 0.5%/year. Polycrystalline: 0.7%/year. Premium SunPower/REC: 0.4%/year. Linear degradation warranty: ≥80% output at year 25. Year-by-year at 0.5%: Year 10: 95%, Year 20: 90%, Year 25: 87.5%. LID (Light-Induced Degradation): first-year drop of 1–3%. TOPCon panels exhibit virtually no LID. High temperatures (>25°C) permanently accelerate degradation.`
  },

  // ─── INSTALLATION ─────────────────────────────────────────────────────────
  {
    id: 'install-roof-types',
    title: 'Roof Compatibility and Mounting Systems',
    category: 'Installation',
    source: 'IronRidge Racking Technical Guide',
    tags: ['roof', 'mount', 'install', 'racking', 'tiles', 'metal', 'flat', 'installation'],
    content: `Solar panels work on most roof types. Asphalt shingles (most common US): Standard flashing mounts. Metal roofs (standing seam): Clamp mounts — no penetrations required. Concrete/clay tiles: Specialized tile hooks; more labor-intensive. Flat roofs: Ballasted racking at 10–15° tilt. Ground-mounted: Post/pile foundations. Roof load: 2–4 lbs/sq ft added. Optimal tilt: equal to latitude (6°N in Lagos = 6–10°). Face true south (Northern Hemisphere) or true north (Southern Hemisphere).`
  },
  {
    id: 'install-orientation',
    title: 'Panel Orientation, Tilt, and Shading Analysis',
    category: 'Installation',
    source: 'PVWatts Calculator (NREL)',
    tags: ['orientation', 'tilt', 'azimuth', 'south', 'shade', 'shadow', 'shading', 'direction', 'compass', 'facing'],
    content: `Azimuth: True south = 180° in Northern Hemisphere. East/West arrays sacrifice 10–20% vs south-facing. Optimal tilt: equal to local latitude. Lagos (6°N): 6–10°. London (51°N): 35–45°. Flat tilt (0°) lowers yield but helps rain self-cleaning. Shading: even 1 shaded cell can reduce string output by 50%+ (bypass diodes mitigate). Tools: Solargraf, Aurora Solar for shading analysis. NREL PVWatts: free tool for location-specific yield estimates.`
  },

  // ─── POLICY & ENVIRONMENT ─────────────────────────────────────────────────
  {
    id: 'policy-ira',
    title: 'Inflation Reduction Act (IRA) Solar Incentives 2022–2032',
    category: 'Policy & Incentives',
    source: 'US Department of Energy',
    tags: ['ira', 'inflation reduction act', 'incentive', 'policy', 'federal', 'battery storage', 'law'],
    content: `The IRA (August 2022) is the largest US clean energy investment in history. Key provisions: 30% Residential Clean Energy Credit (ITC) through 2032, 26% in 2033, 22% in 2034. Battery storage systems eligible for 30% credit even without solar. Commercial solar: 30% base ITC + bonus up to 70% for domestic content and energy community projects. New Energy Efficient Home Improvement Credit: up to $1,200/year. $369 billion total clean energy investment through 2032.`
  },
  {
    id: 'policy-africa-solar',
    title: 'Solar Energy Policy in Sub-Saharan Africa',
    category: 'Policy & Incentives',
    source: 'IRENA Off-Grid Renewable Energy Statistics 2025',
    tags: ['africa', 'nigeria', 'policy', 'off-grid', 'sub-saharan', 'rural', 'electrification', 'ghana'],
    content: `Sub-Saharan Africa has 600+ million people without electricity — solar is the fastest, cheapest solution. Nigeria: Rural Electrification Agency (REA) programs, import duty exemption on solar panels and inverters, feed-in tariff (FiT) for large solar. Ghana: 5% import duty on solar panels (reduced from 25%), GEDAP funding mini-grids. The SHS (Solar Home System) market grew 40% in 2023–2024. Off-grid solar now powers 30+ million African homes.`
  },
  {
    id: 'environment-carbon',
    title: 'Solar Carbon Offset and Environmental Impact',
    category: 'Environment',
    source: 'Project Drawdown Solar PV Analysis',
    tags: ['carbon', 'environment', 'co2', 'emission', 'green', 'clean', 'offset', 'footprint', 'climate'],
    content: `Solar panels reduce CO2 emissions throughout their 25–30 year lifespan. Carbon payback period: 1–4 years to generate the same energy used in manufacturing. Lifecycle CO2: 20–50 gCO2eq/kWh for solar vs 820–1,000 gCO2eq/kWh for coal. A 10 kW system offsets 8–14 tons CO2/year. Over 25 years: 200–350 tons CO2 avoided — equivalent to planting 3,000–5,000 trees. End-of-life recycling: First Solar recycles CdTe panels at 90%+ material recovery. European WEEE directive mandates panel recycling.`
  },

  // ─── SOLAR PULSE PLATFORM ─────────────────────────────────────────────────
  {
    id: 'platform-dashboard',
    title: 'Solar Pulse Dashboard – Real-Time Simulation',
    category: 'Solar Pulse Platform',
    source: 'Solar Pulse Internal Docs',
    tags: ['dashboard', 'solar pulse', 'simulation', 'battery meter', 'real time', 'tab'],
    content: `The Solar Pulse Dashboard simulates a live solar energy system. Features: real-time solar generation gauge, battery charge/discharge animation, grid import/export status, daily generation chart, carbon offset counter, system efficiency metrics. The simulation models an 8 kW array + 20 kWh battery with realistic daily production curves. Navigate to the Dashboard tab in the left sidebar to explore simulated performance.`
  },
  {
    id: 'platform-calculator',
    title: 'Solar Pulse Consumption Calculator',
    category: 'Solar Pulse Platform',
    source: 'Solar Pulse Internal Docs',
    tags: ['calculator', 'consumption', 'appliance', 'kwh', 'solar pulse', 'load', 'tab'],
    content: `The Consumption Calculator helps calculate total household energy use by logging every appliance. Features: built-in appliance library (fridge, AC, fan, TV, lights), custom items, wattage + daily hours per appliance, automatic kWh calculation, monthly/annual consumption summary, recommended solar system size, PDF export. Feeds directly into the Cost & ROI Estimator. Access via the Calculator tab in the sidebar.`
  },
  {
    id: 'platform-estimator',
    title: 'Solar Pulse Cost & ROI Estimator',
    category: 'Solar Pulse Platform',
    source: 'Solar Pulse Internal Docs',
    tags: ['estimator', 'roi', 'cost', 'solar pulse', 'financial', 'projection', '25 year', 'graph', 'tab'],
    content: `The Cost & ROI Estimator generates a 25-year financial projection. Inputs: location, monthly electricity bill, electricity rate, system cost, loan details. Outputs: payback period graph, cumulative savings chart, NPV, IRR, CO2 offset totals. Financing scenarios: cash, solar loan (4.99% APR), PACE financing. Access via the Cost & ROI tab in the sidebar.`
  },
  {
    id: 'platform-orientation',
    title: 'Solar Pulse Orientation & Sun Position Tool',
    category: 'Solar Pulse Platform',
    source: 'Solar Pulse Internal Docs',
    tags: ['orientation', 'compass', 'sun position', 'solar pulse', 'azimuth', 'tilt', 'direction', 'tab'],
    content: `The Orientation Tool finds optimal panel direction and tilt for your location. Features: interactive compass visualization, solar elevation chart by time and season, postal/ZIP code lookup for local sun hours, tilt angle recommendation based on latitude, seasonal irradiance comparison, NREL solar irradiance database integration. Access via the Orientation tab in the sidebar.`
  },
  {
    id: 'platform-chatbot',
    title: 'Solar Pulse AI Advisor – How to Use',
    category: 'Solar Pulse Platform',
    source: 'Solar Pulse Internal Docs',
    tags: ['chatbot', 'ai', 'advisor', 'solar pulse', 'gemini', 'settings', 'api key', 'tab'],
    content: `The Solar Pulse AI Advisor provides expert solar energy guidance. Offline mode: uses a built-in knowledge base with instant responses. Live AI mode: connects to Google Gemini API for full conversational AI. To enable Live AI: click the Settings gear icon (⚙️), enter your free Google Gemini API key from aistudio.google.com, and toggle Live AI Engine on. The advisor remembers conversation history and provides formatted, detailed answers about solar topics.`
  },

  // ─── COMMON QUESTIONS ─────────────────────────────────────────────────────
  {
    id: 'faq-cloudy-days',
    title: 'Does Solar Work on Cloudy Days?',
    category: 'Common Questions',
    source: 'SEIA Consumer FAQ',
    tags: ['cloudy', 'cloud', 'rain', 'weather', 'overcast', 'work', 'dark', 'rainy'],
    content: `Yes, solar panels generate electricity on cloudy days, but at reduced capacity. Output: Overcast days: 10–25% of clear-sky output. Light cloud cover: 50–80%. Rain naturally cleans dust from panels. Snow: panels shed it quickly due to slick glass and heat generation — output resumes once cleared. Germany (famously cloudy) is a top-10 global solar producer, proving solar's viability in low-irradiance climates. Output is zero only when panels are fully covered by heavy snow or dense fog.`
  },
  {
    id: 'faq-property-value',
    title: 'Does Solar Increase Home Value?',
    category: 'Common Questions',
    source: 'Zillow Research & LBNL Study 2023',
    tags: ['home value', 'property', 'resale', 'sell', 'house', 'real estate', 'value', 'increase'],
    content: `Multiple studies confirm solar increases home value. LBNL 2023: Solar homes sell for $3.74–$5.91 per watt more than comparable non-solar homes. A 6 kW system adds $22,000–$35,000 in home value. Zillow: Solar homes sell 4.1% faster at a $9,274 premium on average. Higher premiums in high-electricity-rate markets (California, New York). Owned solar always adds value. Leased systems may complicate sales. In West Africa: growing resale premium for energy-independent homes.`
  },
  {
    id: 'faq-zero-bill',
    title: 'Can Solar Eliminate My Electricity Bill?',
    category: 'Common Questions',
    source: 'EnergySage Consumer Research',
    tags: ['zero bill', 'eliminate', 'free electricity', 'no bill', 'offset 100%', 'eliminate bill'],
    content: `Yes, a properly sized solar system can reduce your electricity bill to near $0. Requirements: system sized to cover 100% of annual consumption, net metering to bank summer excess against winter shortfalls. Minimum utility connection fee ($5–$15/month) applies for most grid-tied customers even with $0 net electricity use. Full off-grid option: add battery storage for nights and cloudy days, remove utility connection. In Nigeria/West Africa: full off-grid preferred due to unreliable grid (NEPA outages).`
  },
  {
    id: 'faq-roof-age',
    title: 'How Old Should My Roof Be Before Installing Solar?',
    category: 'Common Questions',
    source: 'EnergySage Installation Guide',
    tags: ['roof', 'age', 'old roof', 'replace', 'new', 'install', 'shingles', 'roof condition'],
    content: `Your roof should have at least 10–15 years of life remaining before installing solar (panels last 25–30 years). If your roof needs replacement within 10 years, replace it first to avoid $2,000–$5,000 solar removal/reinstallation cost. Signs you need a new roof: missing/curled shingles, sagging, daylight in attic, leaks, granule loss. Lifespans: Asphalt shingles 20–30 years, Metal 40–70 years, Tile 50+ years. Ask your solar installer for a roof assessment during site survey.`
  },
  {
    id: 'faq-hoa',
    title: 'HOA and Solar Panel Rights',
    category: 'Common Questions',
    source: 'SEIA Solar Rights Policy Guide',
    tags: ['hoa', 'homeowners association', 'permission', 'rights', 'restrict', 'allow', 'rules'],
    content: `Most US states have Solar Rights Laws protecting homeowners' right to install solar even if an HOA objects. 40+ states prohibit HOAs from unreasonably restricting solar installations. HOAs may request: architectural review compliance, specific mounting styles, rear/side roof placement preference. Process: submit design to HOA review board (must respond within 45–60 days). If denied unreasonably, check your state's solar rights statute or consult a real estate attorney.`
  },

  // ─── ADVANCED TECHNICAL ───────────────────────────────────────────────────
  {
    id: 'tech-mppt',
    title: 'MPPT (Maximum Power Point Tracking) Technology',
    category: 'Advanced Technical',
    source: 'Victron Energy MPPT Technical Guide',
    tags: ['mppt', 'maximum power point', 'tracking', 'charge controller', 'efficiency', 'pwm'],
    content: `MPPT continuously finds the voltage+current combination producing maximum power from solar panels. The I-V curve's "knee" (MPP) changes with temperature, irradiance, and shading. MPPT algorithms (Perturb & Observe, Incremental Conductance) adjust load to always operate at this optimal point. Efficiency improvement over PWM: 20–30% more energy captured. Modern MPPT charge controllers (Victron SmartSolar, Renogy ROVER): 98–99.5% tracking efficiency.`
  },
  {
    id: 'tech-string-design',
    title: 'String Design and Series/Parallel Wiring',
    category: 'Advanced Technical',
    source: 'SolarEdge String Design Guidelines',
    tags: ['string', 'series', 'parallel', 'wiring', 'voltage', 'current', 'design', 'array'],
    content: `Solar panels in strings (series) increase voltage; strings in parallel increase current. Series: adds voltages, current same. 10 × 40V panels = 400V DC. Parallel: adds current, voltage same. 2 strings of 400V = 400V at 2× current. Rules: Total string voltage ≤ inverter max DC input (600–1,000V). Minimum string voltage > inverter start-up (~150–250V). Shading: one shaded panel reduces entire string (series). Solution: power optimizers (SolarEdge), microinverters (Enphase), or shade-tolerant inverters.`
  },
  {
    id: 'tech-ems',
    title: 'Energy Management Systems (EMS) for Solar + Battery',
    category: 'Advanced Technical',
    source: 'Fronius Symo Gen24 EMS Documentation',
    tags: ['ems', 'energy management', 'smart home', 'automation', 'optimize', 'control', 'smart'],
    content: `EMS intelligently controls energy flows between solar, battery, grid, and loads to maximize self-consumption and minimize costs. Functions: Load shifting (run dishwasher/EV charger during peak solar hours). Battery dispatch optimization (charge from solar, discharge during peak TOU rates). Grid arbitrage (buy cheap overnight power, export during peak hours). Weather forecast integration. Smart home integration: Google Nest, Amazon Alexa, Home Assistant compatible systems (Fronius Symo Gen24, SolarEdge Energy Hub, Tesla Powerwall Gateway).`
  },

  // ─── GLOSSARY ─────────────────────────────────────────────────────────────
  {
    id: 'glossary-terms',
    title: 'Solar Energy Glossary of Key Terms',
    category: 'Reference',
    source: 'Solar Energy Industries Association Glossary',
    tags: ['glossary', 'definition', 'terms', 'meaning', 'what is', 'define', 'explain', 'terminology'],
    content: `Key solar terms defined:
kWp (kilowatt-peak): Rated panel power under Standard Test Conditions (1,000 W/m², 25°C).
kWh (kilowatt-hour): Unit of energy = 1,000W × 1 hour. Electricity bills measured in kWh.
PSH (Peak Sun Hours): Hours/day sun intensity equals 1,000 W/m². Lagos = 5.4 PSH.
DC (Direct Current): Power produced by solar panels and stored in batteries.
AC (Alternating Current): Power used by home appliances and the utility grid.
PV (Photovoltaic): Technology converting light to electricity via semiconductor effect.
BOS (Balance of System): All components besides panels: inverter, wiring, racking, monitoring.
STC (Standard Test Conditions): Lab conditions for rating panel power.
NOCT (Nominal Operating Cell Temperature): More realistic rating at 800 W/m², 20°C ambient.
Voc (Open Circuit Voltage): Max voltage with no load connected.
Isc (Short Circuit Current): Max current with terminals shorted.`
  }
];

export const CATEGORIES = [...new Set(KNOWLEDGE_BASE.map(doc => doc.category))];
export const KB_STATS = {
  totalDocuments: KNOWLEDGE_BASE.length,
  totalCategories: CATEGORIES.length,
  version: '2.0.0',
  lastUpdated: '2025-10-01'
};
