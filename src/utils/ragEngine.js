/**
 * Solar Pulse – RAG (Retrieval-Augmented Generation) Engine v2.0
 * ──────────────────────────────────────────────────────────────
 * Implements:
 *   1. Text preprocessing & tokenisation
 *   2. TF-IDF term frequency scoring
 *   3. BM25-style relevance ranking
 *   4. Tag pre-filtering (fast candidate shortlist)
 *   5. Cosine similarity scoring
 *   6. Query expansion (synonyms + intent detection)
 *   7. Context window construction for LLM prompt injection
 *   8. Source attribution metadata
 */

import { KNOWLEDGE_BASE } from './solarKnowledgeBase.js';

// ─── STOP WORDS ─────────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'it', 'in', 'on', 'at', 'to', 'for', 'of', 'and',
  'or', 'but', 'with', 'this', 'that', 'are', 'was', 'be', 'by', 'as', 'do',
  'can', 'i', 'my', 'me', 'we', 'you', 'your', 'what', 'how', 'why', 'when',
  'where', 'which', 'who', 'will', 'would', 'could', 'should', 'have', 'has',
  'had', 'from', 'not', 'about', 'so', 'if', 'then', 'than', 'get', 'does',
  'there', 'their', 'they', 'he', 'she', 'his', 'her', 'its', 'our', 'some',
  'any', 'all', 'more', 'most', 'much', 'many', 'very', 'also', 'just', 'tell',
  'me', 'please', 'explain', 'describe', 'show', 'give', 'know', 'think',
]);

// ─── QUERY EXPANSION SYNONYMS ────────────────────────────────────────────────
const QUERY_EXPANSIONS = {
  'mono': ['monocrystalline', 'single crystal', 'black panel'],
  'poly': ['polycrystalline', 'multi crystal', 'blue panel'],
  'battery': ['storage', 'powerwall', 'lifepo4', 'backup', 'enphase'],
  'cheap': ['budget', 'affordable', 'low cost', 'inexpensive'],
  'expensive': ['premium', 'high end', 'costly'],
  'roi': ['payback', 'return', 'investment', 'profit', 'save'],
  'tax': ['itc', 'credit', 'incentive', 'rebate'],
  'grid': ['utility', 'net metering', 'nem', 'sell back'],
  'shade': ['shadow', 'shading', 'partial shade'],
  'tilt': ['angle', 'pitch', 'azimuth', 'orientation', 'direction'],
  'africa': ['nigeria', 'ghana', 'lagos', 'west africa', 'tropical'],
  'clean': ['cleaning', 'wash', 'maintenance', 'dirty'],
  'lifetime': ['lifespan', 'years', 'durability', 'warranty', 'last'],
  'cost': ['price', 'expense', 'dollar', 'watt', 'installation'],
  'type': ['kind', 'variety', 'difference', 'compare', 'vs'],
  'hoa': ['homeowners association', 'permission', 'approval'],
  'cloudy': ['cloud', 'overcast', 'rain', 'weather', 'dark'],
  'value': ['home value', 'property', 'resale', 'house price'],
  'bill': ['electricity bill', 'utility bill', 'eliminate', 'zero'],
  'off grid': ['standalone', 'independent', 'no grid', 'remote'],
};

// ─── TEXT PREPROCESSING ─────────────────────────────────────────────────────

/**
 * Tokenize, lowercase, and remove stop words from text
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));
}

/**
 * Expand query with synonyms and related terms
 */
function expandQuery(query) {
  const lower = query.toLowerCase();
  const expansions = [lower];

  for (const [key, synonyms] of Object.entries(QUERY_EXPANSIONS)) {
    if (lower.includes(key)) {
      expansions.push(...synonyms);
    }
    if (synonyms.some(s => lower.includes(s))) {
      expansions.push(key);
    }
  }

  return expansions.join(' ');
}

// ─── TF-IDF SCORING ──────────────────────────────────────────────────────────

/**
 * Calculate term frequency for a document
 */
function termFrequency(tokens, term) {
  const count = tokens.filter(t => t === term).length;
  return count / tokens.length;
}

/**
 * Calculate inverse document frequency across all documents
 */
function buildIDF(corpus) {
  const documentCount = corpus.length;
  const termDocCounts = {};

  for (const doc of corpus) {
    const tokens = new Set(tokenize(doc.content + ' ' + doc.tags.join(' ') + ' ' + doc.title));
    for (const term of tokens) {
      termDocCounts[term] = (termDocCounts[term] || 0) + 1;
    }
  }

  const idf = {};
  for (const [term, count] of Object.entries(termDocCounts)) {
    idf[term] = Math.log((documentCount + 1) / (count + 1)) + 1; // Smoothed IDF
  }

  return idf;
}

/**
 * Calculate TF-IDF score for a document against query terms
 */
function tfidfScore(docTokens, queryTerms, idf) {
  let score = 0;
  for (const term of queryTerms) {
    const tf = termFrequency(docTokens, term);
    const idfVal = idf[term] || 0.1;
    score += tf * idfVal;
  }
  return score;
}

// ─── BM25-STYLE SCORING ──────────────────────────────────────────────────────
const BM25_K1 = 1.5; // Term frequency saturation
const BM25_B = 0.75; // Length normalization

/**
 * BM25 scoring algorithm for better relevance ranking
 */
function bm25Score(docTokens, queryTerms, idf, avgDocLength) {
  let score = 0;
  const docLength = docTokens.length;

  for (const term of queryTerms) {
    const tf = docTokens.filter(t => t === term).length;
    const idfVal = idf[term] || 0;

    if (tf > 0) {
      const numerator = tf * (BM25_K1 + 1);
      const denominator = tf + BM25_K1 * (1 - BM25_B + BM25_B * (docLength / avgDocLength));
      score += idfVal * (numerator / denominator);
    }
  }

  return score;
}

// ─── TAG PRE-FILTERING ───────────────────────────────────────────────────────

/**
 * Fast candidate shortlisting using tag matching
 * Returns candidates with a tag boost score
 */
function tagFilter(documents, queryTokens, queryLower) {
  return documents.map(doc => {
    let tagBoost = 0;

    for (const tag of doc.tags) {
      if (queryLower.includes(tag)) {
        tagBoost += 3.0; // Strong tag match bonus
      } else {
        const tagTokens = tokenize(tag);
        for (const qt of queryTokens) {
          if (tagTokens.includes(qt)) {
            tagBoost += 1.5; // Partial tag token match
          }
        }
      }
    }

    return { doc, tagBoost };
  });
}

// ─── COSINE SIMILARITY ────────────────────────────────────────────────────────

/**
 * Build a simple term vector for cosine similarity
 */
function buildVector(tokens, vocabulary) {
  const vector = {};
  for (const term of vocabulary) {
    vector[term] = tokens.filter(t => t === term).length;
  }
  return vector;
}

function dotProduct(vecA, vecB) {
  let sum = 0;
  for (const key of Object.keys(vecA)) {
    sum += (vecA[key] || 0) * (vecB[key] || 0);
  }
  return sum;
}

function magnitude(vec) {
  return Math.sqrt(Object.values(vec).reduce((sum, v) => sum + v * v, 0));
}

function cosineSimilarity(vecA, vecB) {
  const magA = magnitude(vecA);
  const magB = magnitude(vecB);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(vecA, vecB) / (magA * magB);
}

// ─── PRE-COMPUTED INDEX ───────────────────────────────────────────────────────

// Build IDF index once at module load time (O(N) one-time cost)
const IDF_INDEX = buildIDF(KNOWLEDGE_BASE);
const TOKENIZED_CORPUS = KNOWLEDGE_BASE.map(doc => ({
  id: doc.id,
  tokens: tokenize(doc.content + ' ' + doc.tags.join(' ') + ' ' + doc.title)
}));
const AVG_DOC_LENGTH = TOKENIZED_CORPUS.reduce((sum, d) => sum + d.tokens.length, 0) / TOKENIZED_CORPUS.length;

// ─── MAIN RETRIEVAL FUNCTION ──────────────────────────────────────────────────

/**
 * Retrieve top-K most relevant documents for a query
 * 
 * @param {string} query - User's input query
 * @param {number} topK - Number of documents to retrieve (default: 3)
 * @param {string|null} categoryFilter - Optional category filter
 * @returns {{ doc: object, score: number, confidence: string }[]}
 */
export function retrieve(query, topK = 3, categoryFilter = null) {
  const expandedQuery = expandQuery(query);
  const queryLower = expandedQuery.toLowerCase();
  const queryTokens = tokenize(expandedQuery);

  if (queryTokens.length === 0) return [];

  // Filter by category if specified
  let candidates = KNOWLEDGE_BASE;
  if (categoryFilter) {
    candidates = candidates.filter(doc =>
      doc.category.toLowerCase() === categoryFilter.toLowerCase()
    );
  }

  // Step 1: Tag pre-filtering for initial boost
  const taggedCandidates = tagFilter(candidates, queryTokens, queryLower);

  // Step 2: Get pre-tokenized corpus for candidates
  const candidateTokenized = taggedCandidates.map(({ doc, tagBoost }) => {
    const tokenizedDoc = TOKENIZED_CORPUS.find(t => t.id === doc.id);
    return { doc, tagBoost, tokens: tokenizedDoc?.tokens || [] };
  });

  // Step 3: Build vocabulary for cosine similarity
  const vocabulary = [...new Set([...queryTokens, ...candidateTokenized.flatMap(c => c.tokens)])];
  const queryVector = buildVector(queryTokens, vocabulary);

  // Step 4: Score all documents with composite scoring
  const scored = candidateTokenized.map(({ doc, tagBoost, tokens }) => {
    const bm25 = bm25Score(tokens, queryTokens, IDF_INDEX, AVG_DOC_LENGTH);
    const tfidf = tfidfScore(tokens, queryTokens, IDF_INDEX);
    const docVector = buildVector(tokens, vocabulary);
    const cosine = cosineSimilarity(queryVector, docVector);

    // Composite score: BM25 (weight 0.5) + TF-IDF (weight 0.2) + Cosine (weight 0.1) + Tag Boost (weight 0.2)
    const compositeScore = (bm25 * 0.5) + (tfidf * 0.2) + (cosine * 0.1) + (tagBoost * 0.2);

    return { doc, score: compositeScore, bm25, cosine, tfidf };
  });

  // Step 5: Sort by composite score descending
  scored.sort((a, b) => b.score - a.score);

  // Step 6: Take top-K and add confidence label
  const topResults = scored.slice(0, topK);
  const maxScore = topResults[0]?.score || 1;

  return topResults
    .filter(result => result.score > 0.01) // Relevance threshold
    .map(result => {
      const normalizedScore = result.score / maxScore;
      let confidence;
      if (normalizedScore >= 0.75) confidence = 'high';
      else if (normalizedScore >= 0.40) confidence = 'medium';
      else confidence = 'low';

      return {
        doc: result.doc,
        score: result.score,
        confidence
      };
    });
}

// ─── CONTEXT BUILDER ─────────────────────────────────────────────────────────

/**
 * Build a structured RAG context string from retrieved documents
 * for injection into the LLM system prompt
 *
 * @param {object[]} retrievedDocs - Results from retrieve()
 * @returns {string} Formatted context string
 */
export function buildRAGContext(retrievedDocs) {
  if (!retrievedDocs || retrievedDocs.length === 0) {
    return '';
  }

  const sections = retrievedDocs.map((result, i) => {
    const { doc, confidence } = result;
    return `[Source ${i + 1}] ${doc.title}
Category: ${doc.category} | Authority: ${doc.source} | Confidence: ${confidence}
---
${doc.content}
---`;
  });

  return `
=== RETRIEVED KNOWLEDGE BASE CONTEXT ===
The following expert knowledge has been retrieved specifically for this query.
Use this context as your PRIMARY source of truth when answering.
Cite the source titles naturally in your response.

${sections.join('\n\n')}

=== END CONTEXT ===
`.trim();
}

/**
 * Retrieve documents and format context in one call
 *
 * @param {string} query - User's query
 * @param {number} topK - Number of docs to retrieve
 * @returns {{ context: string, sources: object[] }}
 */
export function ragRetrieve(query, topK = 3) {
  const results = retrieve(query, topK);
  const context = buildRAGContext(results);
  const sources = results.map(r => ({
    title: r.doc.title,
    category: r.doc.category,
    source: r.doc.source,
    confidence: r.confidence,
    id: r.doc.id
  }));

  return { context, sources };
}

/**
 * Pure offline RAG-powered answer (no external API needed)
 * Finds best-matching doc and returns its content directly
 *
 * @param {string} query - User's query
 * @returns {{ answer: string, sources: object[] }}
 */
export function offlineRAGAnswer(query) {
  const results = retrieve(query, 2);

  if (results.length === 0) {
    return {
      answer: null,
      sources: []
    };
  }

  const primary = results[0];
  const secondary = results[1];

  let answer = `### ${primary.doc.title}\n\n${primary.doc.content}`;

  if (secondary && secondary.confidence !== 'low') {
    answer += `\n\n---\n\n### Also Relevant: ${secondary.doc.title}\n\n${secondary.doc.content}`;
  }

  // Add platform cross-reference if not already platform doc
  if (primary.doc.category !== 'Solar Pulse Platform') {
    answer += `\n\n---\n\n*💡 **Pro Tip**: Use the Solar Pulse tools in the sidebar tabs (Dashboard, Calculator, Estimator, Orientation) for interactive simulations and personalized calculations based on your location and usage!*`;
  }

  const sources = results.map(r => ({
    title: r.doc.title,
    category: r.doc.category,
    source: r.doc.source,
    confidence: r.confidence,
    id: r.doc.id
  }));

  return { answer, sources };
}
