/**
 * Solar Pulse – Unified AI Expert Engine v2.0
 * ────────────────────────────────────────────
 * Orchestrates the full RAG + Fine-Tuning pipeline:
 *
 * OFFLINE mode:
 *   query → RAG retrieval → BM25+TF-IDF+Cosine scoring → top-K docs → formatted answer
 *
 * LIVE AI mode (Gemini):
 *   query → RAG retrieval → build RAG context → inject into fine-tuned system prompt
 *          → Gemini API call → streaming response
 */

import { offlineRAGAnswer, ragRetrieve } from './ragEngine.js';
import { buildFineTunedSystemPrompt, detectQueryIntent } from './fineTunePrompt.js';

// ─── OFFLINE RAG MODE ────────────────────────────────────────────────────────

/**
 * Query the offline RAG knowledge engine.
 * Returns a rich, source-attributed answer using BM25+TF-IDF+cosine retrieval.
 *
 * @param {string} message - User query
 * @returns {{ answer: string, sources: object[] }}
 */
export function queryLocalExpert(message) {
  const result = offlineRAGAnswer(message);

  if (result.answer) {
    return result;
  }

  return {
    answer: `Hello! I'm your **Solar Pulse AI Advisor**. ☀️

I'm powered by a comprehensive solar energy knowledge base and can help you with:
* Choosing panel types (**Monocrystalline vs Polycrystalline vs TOPCon vs Bifacial**)
* Explaining financial incentives (**30% Tax Credits, SRECs, Net Metering**)
* Sizing your solar system and battery bank
* Advising on **Battery Storage** (Tesla Powerwall, Enphase, LiFePO4)
* Understanding **Off-Grid vs Grid-Tied vs Hybrid** systems
* **West Africa / Nigeria** specific solar guidance (NEPA, sun hours, off-grid)
* Maintenance, monitoring, and long-term ROI analysis

Ask me anything about solar — or click the **Settings ⚙️** to connect a free **Google Gemini API key** for full conversational AI answers!`,
    sources: []
  };
}

// ─── LIVE AI (GEMINI + RAG + FINE-TUNING) ────────────────────────────────────

/**
 * Query Google Gemini API with RAG context injection + fine-tuned system prompt.
 *
 * @param {string} message - User's current query
 * @param {Array} history - Previous message history [{ sender, text }]
 * @param {string} apiKey - Google Gemini API key
 * @param {object} userContext - Optional user context { region, subscription, sunHours }
 * @returns {Promise<{ answer: string, sources: object[] }>}
 */
export async function queryGeminiAPI(message, history = [], apiKey, userContext = {}) {
  if (!apiKey) {
    throw new Error('API Key missing. Please provide a key in settings.');
  }

  const cleanKey = apiKey.trim().replace(/\|$/, '');

  // Step 1: Intent detection for smarter RAG category pre-filtering
  const intentCategory = detectQueryIntent(message);

  // Step 2: RAG retrieval – find top-3 most relevant knowledge base documents
  const { context: ragContext, sources } = ragRetrieve(message, 3);

  // Step 3: Build fine-tuned system prompt with RAG context + user context
  const systemPrompt = buildFineTunedSystemPrompt(ragContext, {
    region: userContext.region || 'Unknown',
    subscription: userContext.subscription || 'free',
    sunHours: userContext.sunHours || null,
  });

  // Step 4: Format conversation history for Gemini API (user/model alternating turns)
  const formattedContents = [];
  let foundFirstUser = false;

  for (const msg of history) {
    if (!foundFirstUser) {
      if (msg.sender === 'user') foundFirstUser = true;
      else continue;
    }
    const role = msg.sender === 'user' ? 'user' : 'model';
    const last = formattedContents[formattedContents.length - 1];
    if (last && last.role === role) {
      last.parts[0].text += '\n' + msg.text;
    } else {
      formattedContents.push({ role, parts: [{ text: msg.text }] });
    }
  }

  // Step 5: Append current user message
  const lastContent = formattedContents[formattedContents.length - 1];
  if (lastContent && lastContent.role === 'user') {
    lastContent.parts[0].text += '\n' + message;
  } else {
    formattedContents.push({ role: 'user', parts: [{ text: message }] });
  }

  // Step 6: Call Gemini API
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: formattedContents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 1200,
          topP: 0.9,
          topK: 40,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ]
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `HTTP error ${response.status}`);
  }

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!responseText) {
    throw new Error('Empty response received from Gemini.');
  }

  return { answer: responseText, sources };
}
