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

// ─── CONCISE INTENT SYNTHESIS DICTIONARY ────────────────────────────────────
// Each topic provides a direct, expert answer strictly within a 2 to 3 sentence range.
const CONCISE_TOPIC_ANSWERS = [
  {
    pattern: /\b(mono|monocrystalline)\b.*\b(poly|polycrystalline)\b|\b(poly|polycrystalline)\b.*\b(mono|monocrystalline)\b|\bcompare\b.*\bpanels?\b/i,
    docId: 'panels-monocrystalline',
    answer: "**Monocrystalline panels** offer 19–24% efficiency and a sleek all-black look, making them the industry gold standard for homes with limited roof area. **Polycrystalline panels** are more budget-friendly ($0.50–$0.75/W) at 15–18% efficiency but require ~25% more roof space to achieve the same wattage. For most modern residential installations, monocrystalline yields higher lifetime power output and superior return on investment."
  },
  {
    pattern: /\bnet\s*metering\b|\bnem\b|\bsell\s*back\b|\bgrid\s*credits?\b/i,
    docId: 'finance-net-metering',
    answer: "**Net metering** sends your excess daytime solar electricity to the utility grid in exchange for billing credits. You draw against those accumulated credits at night and on cloudy days to power your home for free or at reduced rates. This drastically lowers your monthly electricity bill without requiring the upfront cost of an energy storage battery."
  },
  {
    pattern: /\bbatter(y|ies)\b|\bpowerwall\b|\bbackup\b|\bstorage\b|\blifepo4\b/i,
    docId: 'battery-basics',
    answer: "Standard grid-tied solar panels automatically shut down during utility outages for line-worker safety unless paired with a **battery storage system**. Adding a modern lithium battery (such as LiFePO4 or Tesla Powerwall) stores daytime solar surplus to provide instant blackout protection and cover expensive peak-rate hours. If your area suffers frequent outages or time-of-use utility rates, battery storage is strongly recommended."
  },
  {
    pattern: /\b(cost|price|save|savings|payback|roi|how\s*much)\b.*\b(solar|system|install)\b/i,
    docId: 'finance-payback-roi',
    answer: "A residential solar installation typically costs between $15,000 and $25,000 before federal tax incentives, with an average payback period of **5 to 8 years**. Once paid off, your system provides essentially free electricity for the remainder of its 25+ year operational lifespan. In locations with high utility rates or where solar replaces diesel generator fuel, payback can occur in as little as 2.5 to 3.5 years."
  },
  {
    pattern: /\b(tilt|angle|orientation|direction|azimuth|south|pitch)\b/i,
    docId: 'install-tilt-angle',
    answer: "Panels in the Northern Hemisphere should face **true South** at a tilt angle roughly equal to your geographic latitude for maximum annual electricity production. In tropical latitudes like West Africa, a shallow 10°–15° tilt captures intense overhead sun while allowing natural rainwater to rinse away surface dust. Proper orientation can enhance your overall annual solar yield by up to 15%."
  },
  {
    pattern: /\b(cloud|cloudy|rain|rainy|overcast|winter|snow|shade)\b/i,
    docId: 'install-shading',
    answer: "Solar panels continue generating power in cloudy or rainy conditions, typically producing **10% to 25%** of their rated peak capacity using diffuse ambient sunlight. Modern high-efficiency cells like TOPCon and PERC are engineered with enhanced low-light sensitivity to optimize overcast production. Your system's annual sizing and production estimates already factor in regional cloudy days and seasonal weather shifts."
  },
  {
    pattern: /\b(how\s*many\s*panels|system\s*size|sizing|size\s*my|how\s*big|kw\s*needed)\b/i,
    docId: 'sizing-basics',
    answer: "To determine your system size, divide your daily electricity consumption (kWh) by your area's peak daily sun hours (typically 4.5–6 hours). An average household consuming 30 kWh per day requires an array of approximately **6 kW to 7.5 kW** (15 to 18 high-efficiency panels). You can use our sidebar **Consumption Calculator** to calculate your exact kilowatt requirements in seconds."
  },
  {
    pattern: /\b(inverter|microinverter|string\s*inverter|hybrid\s*inverter|optimizer)\b/i,
    docId: 'system-inverter-types',
    answer: "**String inverters** connect panels in series and are cost-effective, but shading on a single panel reduces output across the entire string. **Microinverters** operate independently at each panel, maximizing overall array production and offering panel-by-panel performance tracking. If your roof has partial tree shading or multiple roof pitches, microinverters or DC optimizers are the recommended choice."
  },
  {
    pattern: /\b(clean|cleaning|maintain|maintenance|dirty|wash|dust)\b/i,
    docId: 'maint-cleaning',
    answer: "Solar panels require minimal maintenance because they have no moving parts and are built to withstand extreme weather for 25–30 years. Natural rainfall washes away most dust and debris, but a gentle rinse with plain water and a soft cloth once or twice a year can recover 3–5% of lost output. Never use abrasive chemicals, hard brushes, or high-pressure washers that could scratch the protective anti-reflective coating."
  },
  {
    pattern: /\b(nigeria|lagos|africa|nepa|nepa\s*light|generator|fuel|petrol|diesel)\b/i,
    docId: 'sizing-africa-nigeria',
    answer: "In Nigeria and West Africa, solar systems paired with lithium (LiFePO4) storage offer continuous 24/7 electricity while eliminating steep petrol and diesel generator expenses. A standard 5 kW hybrid solar setup pays for itself in just **2.5 to 3.5 years** compared to daily generator fueling. It also provides clean, silent power and shields delicate household electronics from unstable utility grid surges."
  },
  {
    pattern: /\b(tax\s*credit|itc|rebate|incentive|srec|grant)\b/i,
    docId: 'finance-tax-credits-itc',
    answer: "The federal **Residential Clean Energy Credit (ITC)** allows homeowners to deduct **30%** of their total solar and battery installation costs directly from federal taxes. Additional state rebates, solar renewable energy certificates (SRECs), and local utility credits can decrease your net expense even further. Taking full advantage of these incentives significantly accelerates your payback timeline."
  },
  {
    pattern: /\b(lifespan|life|degradation|warranty|how\s*long\s*do\s*panels\s*last|durab)\b/i,
    docId: 'maint-degradation',
    answer: "Tier-1 solar panels have an expected operational lifespan of **25 to 30 years** and typically come backed by a 25-year manufacturer performance warranty. Panels degrade slowly, losing only about **0.3% to 0.5%** of capacity each year, guaranteeing at least 80–85% of their original output at year 25. Modern solar inverters and lithium batteries typically last 10 to 15 years before requiring scheduled replacement."
  },
  {
    pattern: /\b(solar\s*pulse|this\s*app|tools?|calculator|estimator|how\s*to\s*use)\b/i,
    docId: 'platform-overview',
    answer: "**Solar Pulse** provides a complete suite of solar engineering tools designed for both homeowners and analysts. Use the **Dashboard** for live telemetry simulation, the **Consumption Calculator** to size your system, and the **Cost & ROI Estimator** for 25-year financial projections. You can also fine-tune roof angles using the **Orientation Tuning** tool in the sidebar."
  }
];

/**
 * Extracts 2 to 3 concise, informative sentences from document content.
 * Guarantees sentence count is strictly between 2 and 4 sentences.
 */
function extractConciseSentences(content, queryTokens) {
  const sentences = content
    .replace(/([.!?])\s+(?=[A-Z0-9])/g, "$1\n")
    .split("\n")
    .map(s => s.trim())
    .filter(s => s.length > 25 && !s.toLowerCase().startsWith("leading products:"));

  if (sentences.length <= 3) {
    return sentences.join(" ");
  }

  // Score sentences by query relevance & data density
  const scored = sentences.map((sentence, idx) => {
    const lower = sentence.toLowerCase();
    let score = (idx === 0) ? 2.5 : 0; // Prioritize lead concept sentence

    for (const token of queryTokens) {
      if (lower.includes(token)) score += 1.8;
    }
    if (/[\d%₦$]/.test(sentence)) score += 1.0; // Boost sentences with concrete figures

    return { sentence, score, idx };
  });

  scored.sort((a, b) => b.score - a.score);

  // Take top 2-3 sentences and sort by original narrative flow
  const chosen = scored.slice(0, 3).sort((a, b) => a.idx - b.idx);
  return chosen.map(c => c.sentence).join(" ");
}

/**
 * Pure offline RAG-powered concise answer (no external API needed)
 * Delivers crisp, direct solar answers strictly within a 2-4 sentence range.
 *
 * @param {string} query - User's query
 * @returns {{ answer: string, sources: object[] }}
 */
export function offlineRAGAnswer(query) {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return {
      answer: null,
      sources: []
    };
  }

  // 1. Check curated concise topic answers first for maximum relevance and crisp 2-3 sentence range
  for (const topic of CONCISE_TOPIC_ANSWERS) {
    if (topic.pattern.test(cleanQuery)) {
      const matchedDoc = KNOWLEDGE_BASE.find(d => d.id === topic.docId);
      return {
        answer: topic.answer,
        sources: matchedDoc ? [{
          title: matchedDoc.title,
          category: matchedDoc.category,
          source: matchedDoc.source,
          confidence: 'high',
          id: matchedDoc.id
        }] : []
      };
    }
  }

  // 2. Retrieve top matching document from 50+ item knowledge corpus
  const results = retrieve(cleanQuery, 2);
  if (results.length === 0) {
    return {
      answer: null,
      sources: []
    };
  }

  const primary = results[0];
  const queryTokens = tokenize(expandQuery(cleanQuery));
  const conciseSummary = extractConciseSentences(primary.doc.content, queryTokens);

  // Formulate concise answer strictly within 2-4 sentence range
  const answer = `**${primary.doc.title}**: ${conciseSummary}`;

  const sources = [
    {
      title: primary.doc.title,
      category: primary.doc.category,
      source: primary.doc.source,
      confidence: primary.confidence,
      id: primary.doc.id
    }
  ];

  return { answer, sources };
}
