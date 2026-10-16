import { describe, it, expect } from 'vitest';
import { retrieve, offlineRAGAnswer } from './ragEngine';
import { KNOWLEDGE_BASE } from './solarKnowledgeBase';

describe('RAG engine and Solar Guide', () => {
  it('retrieves relevant documents with confidence rating', () => {
    const results = retrieve('monocrystalline vs polycrystalline panels', 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].doc).toBeDefined();
    expect(results[0].doc.title).toMatch(/Monocrystalline|Polycrystalline/);
    expect(['high', 'medium', 'low']).toContain(results[0].confidence);
  });

  it('delivers concise answers and resolves valid source documents', () => {
    const testQueries = [
      'Monocrystalline vs Polycrystalline?',
      'How does Net Metering work?',
      'Do I need batteries for backup?',
      'What does solar cost and how much can I save?',
      'What is the optimal roof tilt angle?',
      'How does solar work in cloudy weather?',
      'How many solar panels do I need?',
      'What inverter should I get?',
      'How do I clean and maintain solar panels?',
      'Solar energy in Nigeria with generator',
      'What is the status of solar tax credits?',
      'What is the lifespan and degradation of solar panels?',
      'How to use the Solar Pulse platform?'
    ];

    for (const q of testQueries) {
      const res = offlineRAGAnswer(q);
      expect(res.answer).toBeDefined();
      expect(res.answer.length).toBeGreaterThan(20);
      expect(res.sources.length).toBeGreaterThan(0);

      // Verify that every source ID actually exists in KNOWLEDGE_BASE
      for (const src of res.sources) {
        const found = KNOWLEDGE_BASE.some(d => d.id === src.id);
        expect(found, `Source id "${src.id}" should exist in KNOWLEDGE_BASE`).toBe(true);
      }
    }
  });

  it('handles empty or unrecognized queries gracefully', () => {
    const empty = offlineRAGAnswer('');
    expect(empty.answer).toBeNull();
    expect(empty.sources).toEqual([]);

    const gibberish = offlineRAGAnswer('xyzabc1234987');
    // Either returns null or low confidence matching doc
    expect(gibberish).toBeDefined();
  });
});
