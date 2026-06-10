// Solar Pulse AI Assistant Reasoning Engine & External API Integration

// Local Fallback Knowledge Base - Matches keywords for fast, high-quality, offline responses
const localKnowledge = [
  {
    keywords: ['mono', 'poly', 'type', 'panel', 'monocrystalline', 'polycrystalline'],
    answer: `### Choosing the Right Solar Panel Type

For modern residential setups, there are two primary technologies:

1. **Monocrystalline Panels** (Recommended)
   - **Efficiency**: 19% - 23% (Highest efficiency available).
   - **Aesthetics**: Premium, sleek, all-black look.
   - **Lifespan**: 25 - 30+ years.
   - **Cost**: Slightly higher upfront investment, but yields more energy in smaller spaces.

2. **Polycrystalline Panels**
   - **Efficiency**: 15% - 18%.
   - **Aesthetics**: Speckled blue appearance.
   - **Cost**: Highly budget-friendly, but requires larger roof space to equal monocrystalline output.

**Recommendation**: If you have limited roof space or prefer a premium aesthetic, **Monocrystalline** is the industry gold standard. Try running our **Solar Cost Estimator** tab to see recommendations based on your roof space!`
  },
  {
    keywords: ['payback', 'roi', 'return', 'save', 'saving', 'years'],
    answer: `### Solar System Return on Investment (ROI)

The average payback period for a residential solar system is **5 to 8 years**, after which your electricity is **100% free** for the remainder of the panels' 25+ year lifespan.

**Key Drivers of Payback Period**:
* **Local Electricity Rates**: The higher your current utility rates, the faster your system pays for itself.
* **Federal Tax Incentives**: The **30% Federal Residential Clean Energy Credit (ITC)** reduces upfront installation costs immediately.
* **Sunlight Exposure**: More average peak sun hours equals more generation and higher savings.

*Tip: Use the **Cost & ROI Estimator** tab in the sidebar to simulate your specific payback period and see a 25-year cumulative comparison graph!*`
  },
  {
    keywords: ['net metering', 'grid', 'sell back', 'credit'],
    answer: `### What is Net Metering?

**Net Metering (Net Energy Metering - NEM)** is a billing mechanism that credits you for the excess electricity your solar panels send back to the utility grid.

* **Daytime**: Your solar panels generate more energy than your home consumes. The excess is pushed to the grid, making your utility meter run backward!
* **Nighttime**: When solar generation stops, you pull power from the grid as normal.
* **Billing**: At the end of the month, you are only billed for the "Net" electricity consumed (Total Consumed minus Excess Generated).

*Note: Net metering laws vary by state and country. Some areas offer 1:1 retail credits, while others pay a lower wholesale rate.*`
  },
  {
    keywords: ['battery', 'tesla', 'storage', 'backup', 'powerwall', 'charge'],
    answer: `### Solar Battery Storage Systems

Integrating battery storage (like the Tesla Powerwall or Enphase 5P) provides massive benefits:

1. **Energy Independence**: Store excess daytime solar power to run your home during peak hours (5 PM - 9 PM) when grid rates are highest.
2. **Emergency Backup**: Keep lights, refrigerators, and medical equipment running during grid blackouts.
3. **Off-Grid Potential**: Properly sized solar + battery storage can take your home completely off the grid.

*Check out the interactive battery meter on our **Dashboard** to see simulated charging dynamics in action!*`
  },
  {
    keywords: ['tax credit', 'incentive', 'itc', 'rebate', 'discount', 'free money'],
    answer: `### Solar Incentives & Financial Aids

In many regions, governments actively incentivize solar adoptions:

* **United States Federal ITC**: Offers a **30% tax credit** on the total cost of your solar system (including panels, wiring, permits, and batteries). If a system costs $15,000, you save **$4,500** directly on your federal taxes.
* **State Rebates**: Many states offer Solar Renewable Energy Certificates (SRECs), cash-back rebates, and property tax exemptions.
* **Solar Incentives**: Solar panels are exempt from sales and property taxes in many jurisdictions, meaning your home value increases tax-free!`
  },
  {
    keywords: ['size', 'how many', 'number of panels', 'kW', 'capacity'],
    answer: `### Sizing Your Solar System

The average home requires a **6 kW to 10 kW** solar system.

To calculate how many panels you need, apply this industry standard formula:
$$\\text{Number of Panels} = \\frac{\\text{System Size (Watts)}}{\\text{Panel Wattage (e.g. 400W)}}$$

For a standard 8 kW (8,000W) system using 400-Watt high-efficiency panels:
$$\\frac{8000\\text{W}}{400\\text{W}} = 20\\text{ Panels}$$

*Try using our **Solar Consumption Calculator** to find your daily usage, then flip over to the **Cost & ROI Estimator** to find your exact panel count recommendations instantly!*`
  },
  {
    keywords: ['maintenance', 'clean', 'dirty', 'wash', 'rain', 'snow'],
    answer: `### Solar Panel Maintenance & Care

Solar panels are incredibly durable since they have zero moving parts. However, a little care goes a long way:

* **Cleaning**: Rain will naturally wash away light dust. In dusty or dry climates, spraying panels with a standard garden hose 2-3 times a year can boost performance by **5% - 12%**. Avoid abrasive soaps or hard brushes!
* **Snow**: Panels are slick and mounted at angles, so snow usually slides off quickly. Because they absorb heat, they melt snow faster than shingles.
* **Warranty**: Premium panels come with a **25-year performance warranty** guaranteeing they will still produce at least 85% of their original rated power after 25 years.`
  }
];

// Fallback greeting if no keywords match
const defaultFallback = `Hello! I'm your **Solar Pulse AI Advisor**. ☀️

I'm loaded with solar intelligence and can help you with:
* Choosing panel types (**Monocrystalline vs Polycrystalline**)
* Explaining financial incentives (**30% Tax Credits, Rebates**)
* Detailing **Net Metering** and Grid interactions
* Advising on **Battery Storage & Backups** (Tesla Powerwall, etc.)
* Sizing your system or understanding your payback period.

You can ask me questions like *"Should I get batteries?"* or *"How many panels do I need?"* 

*To unlock full-scale conversational AI answers, click the **Settings Cog ⚙️** at the top right of this chat window to enter a free **Google Gemini API Key**!*`;

/**
 * Clean & match queries locally
 */
export function queryLocalExpert(message) {
  const cleanMessage = message.toLowerCase();
  
  // Look for keyword matches
  for (const item of localKnowledge) {
    if (item.keywords.some(keyword => cleanMessage.includes(keyword))) {
      return item.answer;
    }
  }
  
  return defaultFallback;
}

/**
 * Call the Free Google Gemini API client-side with user's key
 */
export async function queryGeminiAPI(message, history = [], apiKey) {
  if (!apiKey) {
    throw new Error('API Key missing. Please provide a key in settings.');
  }

  const cleanKey = apiKey.trim().replace(/\|$/, '');

  // System instructions to feed the AI
  const systemPrompt = `You are "Solar Pulse AI", a professional, world-class Solar Energy Advisor and Consultant embedded in the Solar Pulse Energy Platform.
Your goal is to answer queries about solar technology, battery storage, panel selection, payback estimation, grid interactions, and green energy incentives.
Keep your answers professional, helpful, formatted in beautiful markdown, and encouraging. If applicable, recommend the user check the other tabs of the Solar Pulse platform:
- "Dashboard" (for real-time solar tracking simulation)
- "Consumption Calculator" (for calculating appliance draw in kWh)
- "Cost Estimator" (for customized 25-year financial ROI projections)

Keep your tone encouraging and educational. Format formulas or metrics beautifully.`;

  // Format history for Gemini API
  const formattedContents = [];
  
  // Format past history (must start with 'user' role for Gemini API)
  let foundFirstUserTurn = false;
  history.forEach(msg => {
    if (!foundFirstUserTurn) {
      if (msg.sender === 'user') {
        foundFirstUserTurn = true;
      } else {
        // Skip leading assistant greetings or system messages
        return;
      }
    }
    
    // Ensure we do not add consecutive duplicate roles (if any)
    const role = msg.sender === 'user' ? 'user' : 'model';
    const lastContent = formattedContents[formattedContents.length - 1];
    if (lastContent && lastContent.role === role) {
      // Append text to existing turn's parts
      lastContent.parts[0].text += '\n' + msg.text;
    } else {
      formattedContents.push({
        role: role,
        parts: [{ text: msg.text }]
      });
    }
  });

  // Add the current prompt
  const lastContent = formattedContents[formattedContents.length - 1];
  if (lastContent && lastContent.role === 'user') {
    // If last role was also user (edge case), append to it
    lastContent.parts[0].text += '\n' + message;
  } else {
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }]
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: formattedContents,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData?.error?.message || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error('Empty response received from Gemini.');
    }
    
    return responseText;
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
}
