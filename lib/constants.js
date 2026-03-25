// ─── Step Definitions ─────────────────────────────────────────────
export const STEPS = [
  { id: 1, label: "Brand Analysis", icon: "search", short: "Analysis" },
  { id: 2, label: "Competitor Intel", icon: "bar-chart-2", short: "Competitors" },
  { id: 3, label: "Topic Generation", icon: "lightbulb", short: "Topics" },
  { id: 4, label: "Keyword Research", icon: "key", short: "Keywords" },
  { id: 5, label: "Blog Outline", icon: "layout-list", short: "Outline" },
  { id: 6, label: "Blog Post", icon: "pen-line", short: "Blog Post" },
  { id: 7, label: "SEO Optimization", icon: "rocket", short: "SEO Meta" },
];

const CURRENT_DATE = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export const SYSTEM_PROMPT = `You are a world-class AI Content Strategist and Search Experience Optimizer (SXO). You apply Google's Search Quality Rater Guidelines (E-E-A-T) and the helpful content system principles to every output you generate.

## TEMPORAL CONTEXT (CRITICAL):
Today's date is ${CURRENT_DATE}. All analysis, topics, keywords, and trend identification MUST be relevant to the current moment (2025-2026). Do NOT reference outdated trends, old statistics, or strategies that peaked before 2024. Focus exclusively on what is ranking and converting NOW.

## Your Advanced SEO Principles:
- **Topical Authority**: Build deep topical clusters. Don't just target a keyword; own the entire subject area by covering sub-topics and related entities.
- **Entity-Based Research**: Identify the core entities (People, Brands, Events, Concepts) associated with a niche. Use schema-friendly attributes.
- **Search Intent DNA**: Map every keyword to its specific stage in the buyer's journey: Awareness (Informational), Consideration (Commercial), or Decision (Transactional).
- **SXO (Search Experience)**: Prioritize the human search experience. Layout content for "scannability" with high information density and zero fluff.
- **Semantic Connectivity**: Link concepts naturally. Use LSI (Latent Semantic Indexing) terms and secondary entities to help search engines understand context.

## Output Formatting Rules:
- **Strictly ASCII only**: Do NOT use emojis or non-standard characters in headings or important text (they break PDF exports).
- Use ## for main sections, ### for sub-sections.
- Use professional data tables for comparisons.
- Formatting must be clean, structured, and "copy-paste ready" for a CMS.

## The Quality Bar:
Your output must be indistinguishable from a senior human SEO director's work. Be specific, data-oriented (even when estimating), and deeply strategic.`;

// ─── Step Prompts ─────────────────────────────────────────────────
export const PROMPT_STEP1 = (url, context = {}, scrapeContext = "") => {
  const contextStr = [
    context.category && `Business Category: ${context.category}`,
    context.products && `Key Products/Services: ${context.products}`,
    context.audience && `Target Audience: ${context.audience}`,
  ].filter(Boolean).join("\n");

  return `Perform a Strategic Brand Semantic Audit on the following target:
URL: ${url}
${contextStr ? `\nBrand Context:\n${contextStr}\n` : ""}
${scrapeContext ? `\nREAL-TIME HOME PAGE CRAWL:\n${scrapeContext}\nUse this exact scraped data to firmly ground the audit.\n` : ""}
  Analyze the target's public brand presence and digital footprint to provide:
1. **Core Value Proposition** — the sharpest unique selling point
2. **Entity Profile** — what entities (people, products, locations) is this brand associated with?
3. **Content Maturity** — where is their content currently lacking in the funnel?
4. **Authority Score (Estimated)** — based on brand mentions and presence
5. **Audience Persona** — name a specific archetype (e.g. "The Time-Poor Tech Lead")
6. **Actionable SEO Recommendations** — 3 specific, high-impact improvements (technical or content-based) to boost their organic search presence based on this audit

Format with ## headings. No emojis.`;
};

export const PROMPT_STEP2 = (serpContext = "") => {
  const currentMonthYear = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  return `Identify the TOP 4-5 Strategic Competitors from the provided data and perform a deep-dive analysis on their most recent/successful blog content for ${currentMonthYear}.

${serpContext ? `REAL-TIME SERP DATA (FOCUS ON LATEST POSTS):\n${serpContext}\n\n` : ""}

You must extract their latest content strategy and break it down into highly actionable insights for the user. Do not use generic metrics tables.

For EACH competitor, format EXACTLY like this example:

### Competitor Name – "Their Actual Latest Blog Post Title"
**Focus:** [A concise 1-sentence summary of what the post is really targeting].
**Key Topics Covered:**
- [Specific sub-topic or angle 1]
- [Specific sub-topic or angle 2]
- [Specific sub-topic or angle 3]
**➡️ Insight for you:** [What makes this work? E.g., "Gifting guides and relatable tone attract lifestyle readers."]
**💡 Example blog idea:** "[A specific, highly-optimized blog title the user could write right now to outrank this or fill the gap]"

Rules:
- Make it highly specific to the current year and month (${currentMonthYear}).
- The "Insight" and "Example blog idea" must be direct and immediately actionable for the user's content calendar.
- No fluff, no generic SEO advice. Just raw, actionable competitor intelligence.`;
};

export const PROMPT_STEP3 = (rivalsStr = "") => `Synthesize these top-ranking rivals for this niche:
${rivalsStr}

Architect a "Topical Cluster" of 10 High-Authority Blog Topics that specifically target the "Competitor Gaps" found. ALL topics MUST be relevant to 2025-2026 search trends — no recycled evergreen topics that every competitor already ranks for.

## FORMATTING RULES (CRITICAL):
1. Use a CONTINUOUS list numbered 1 to 10. DO NOT repeat "1." or reset the list. 
2. Use this EXACT structure for EVERY topic:

[Number]. **[Catchy SEO Title Here]**
- **Role**: [Pillar/Supporting/Bridge]
- **Intent**: [Transactional/Informational/etc]
- **Ranking Path**: [1 sentence on why we beat rivals]
- **Main Entity**: [The core entity]

Do NOT use labels like "SEO Title:". Do NOT use "Cluster Role:". Do NOT use hashtags (###). Deliver exactly 10 topics.`;

export const PROMPT_STEP4 = (topic, serpContext = "") => {
  const contextBlock = serpContext 
    ? `REAL-TIME SERP DATA Context:\n${serpContext}\nUse this live search data to accurately inform realistic keyword difficulty and search intent.\n\n` 
    : "";

  return `Perform deep Keyword Research for the topic: "${topic}".

${contextBlock}CRITICAL REQUIREMENT: Generate highly realistic, real-world search queries that human users actually type into Google. 
Do NOT hallucinate futuristic, sci-fi, or "AI" trend keywords unless the topic explicitly demands it. (e.g., Do not suggest "AI digital wardrobe" for a physical jewelry company). 
Focus on exact-match long-tail opportunities, problem-aware questions, and transactional phrases related to the core topic.

OUTPUT FORMAT (follow this EXACTLY for all 10 keywords — no deviations):

1.
Target Keyword: [the exact human-typed search phrase goes here]
Search Intent: [Informational / Commercial / Transactional / Navigational]
Position Potential: [High / Medium / Low]
Difficulty Score: [number 1-100]

2.
Target Keyword: [the exact search phrase goes here]
...and so on up to 10.

STRICT RULES:
- The line "Target Keyword:" MUST be followed by a plain search phrase only. No bold (**), no brackets, no extra labels.
- Each keyword must be a real, searchable phrase (2-7 words). Do NOT output category names, meta-labels, or your own descriptions.
- Do NOT skip numbers. List must go from 1 to 10 continuously.
- No emojis. No markdown inside keyword values.`;
};

export const PROMPT_STEP5 = (choice, keywordNote) => `Draft a "Conversion-First" Content Blueprint for: "${choice}".${keywordNote}

Structure the outline to capture both featured snippets and professional trust.

## CONTENT ARCHITECTURE
H1: (Final AI-Optimized Title)

### THE HOOK (Introduction)
- Pattern interrupt to grab attention
- "Problem/Agitation/Solution" framework
- Internal link opportunity

### THE SUBSTANCE (Body)
- 4-6 H2 sections using Keyword Clusters
- Strategic placement of H3s for scannability
- Data visualization / Table placeholder ideas

### THE AUTHORITY (E-E-A-T)
- One "Deep Dive" section requiring technical expertise
- Case study or Example placeholder

### THE CLOSURE (Conclusion & CTA)
- Summary of value
- High-intent Call-to-Action

## ADVANCED SEO METADATA
- **Entity Mentions**: List 5 entities to tag or mention
- **Internal Link Map**: 3 suggested anchor texts
- **External Authority Links**: 3 high-authority domains to cite`;

export const PROMPT_STEP6 = (choice, outlineNote = "", ragContext = "") => `Generate the ULTIMATE, HIGH-DENSITY blog post for: "${choice}".${outlineNote}

${ragContext ? `\nEXTRACTED LIVE FACTS & SOURCES (Incorporate these where relevant for E-E-A-T):\n${ragContext}\n` : ""}

## WRITING RIGOR:
- **Length**: 2000 - 2500 words of pure, high-value insight.
- **Format**: H2 and H3 structure. No fluff. No "In the digital age..." cliches.
- **Entity Saturation**: Naturally incorporate the LSIs and Entities from Step 4.
- **Conversion Optimization**: Use bolding for "Skim-Readers" to extract 80% of the value in 20% of the time.
- **Schema-Ready**: Format the FAQ section precisely (Q: / A:) for Easy Google detection.
- **Human Expertise**: Write with the tone of a Subject Matter Expert (SME). Use industry-specific terminology correctly.

(Produce the FULL content now. Do not truncate. Focus on extreme quality and semantic depth.)`;

export const PROMPT_STEP7 = () => `Provide the Final Advanced SEO Performance Sheet.

## 1. META INTELLIGENCE
- **Meta Title**: High-CTR, keyword-rich (max 60 chars)
- **Meta Description**: Persuasive, includes primary + 1 secondary keyword (max 155 chars)

## 2. TECHNICAL SEO ASSETS
- **URL Slug**: SEO-clean
- **Alt Text Schema**: Detailed descriptions for 3 recommended images
- **Schema.org Type**: Recommendation (e.g., FAQPage + Article)

## 3. INTERNAL LINKING ARCHITECTURE
- Identify 3 "Parent" pages to link from
- Identify 3 "Child" topics to link to internally

## 4. CONTENT VELOCITY & PERFORMANCE
- **Score (1-100)**: Rank this post's ranking potential
- **Post-Publish Checklist**: 8 tactical moves to promote and index this content`;
