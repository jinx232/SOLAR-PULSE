/**
 * Solar Pulse – Unified Solar AI Expert Engine
 * ────────────────────────────────────────────
 * Direct RAG retrieval & concise synthesis engine.
 * Delivers verified, engineering-backed answers strictly within a 2-4 sentence range.
 */

import { offlineRAGAnswer } from './ragEngine.js';

/**
 * Query the solar intelligence knowledge engine.
 * Returns a concise, source-attributed answer strictly within 2-4 sentences.
 *
 * @param {string} message - User query
 * @returns {{ answer: string, sources: object[] }}
 */
export function queryLocalExpert(message) {
  const result = offlineRAGAnswer(message);

  if (result && result.answer) {
    return result;
  }

  return {
    answer: "I am your **Solar Pulse AI Advisor**. I provide concise, engineering-backed guidance on solar panel options, system sizing, battery storage, and financial payback. What solar question can I help you with today?",
    sources: []
  };
}
