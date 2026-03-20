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

export const SYSTEM_PROMPT = `You are a world-class AI Content Stratgist and Search Experience Optimizer (SXO). You apply Google's Search Quality Rater Guidelines (E-E-A-T) and the helpful content system principles to every output you generate.

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
export const PROMPT_STEP1 = (url, context = {}) => {
  const contextStr = [
    context.category && `Business Category: ${context.category}`,
    context.products && `Key Products/Services: ${context.products}`,
    context.audience && `Target Audience: ${context.audience}`,
  ].filter(Boolean).join("\n");

  return `Perform a Strategic Brand Semantic Audit on the following target:
URL: ${url}
${contextStr ? `\nBrand Context:\n${contextStr}\n` : ""}
Analyze the target's public brand presence and digital footprint to provide:
1. **Core Value Proposition** — the sharpest unique selling point
2. **Entity Profile** — what entities (people, products, locations) is this brand associated with?
3. **Content Maturity** — where is their content currently lacking in the funnel?
4. **Authority Score (Estimated)** — based on brand mentions and presence
5. **Audience Persona** — name a specific archetype (e.g. "The Time-Poor Tech Lead")

Format with ## headings. No emojis.`;
};

export const PROMPT_STEP2 = (serpContext = "") => `Identify the TOP 5 Strategic Competitors and perform a Backlink Contribution & Content Gap Analysis.

${serpContext ? `REAL-TIME SERP DATA:\n${serpContext}\n\n` : ""}

For each competitor, analyze:
- **Winning Content Patterns** — what formats are earning them the most visibility?
- **Linked-To Content** — which pages are likely their "link magnets"?
- **Authority Voice** — how do they position themselves (e.g., The Rebel vs. The Establishment)?

Then provide:
- 📊 **COMPARATIVE METRICS TABLE**: Columns: Competitor | Estimated Traffic Share | Content Depth | Key Advantage | Vulnerability
- **TOP 3 CONTENT GAPS** — exact sub-topics they have ignored that we can dominate.
- **STRATEGIC RECOMMENDATION** — one high-level move to leapfrog these competitors.`;

export const PROMPT_STEP3 = (rivalsStr = "") => `Synthesize these top-ranking rivals for this niche:
${rivalsStr}

Architect a "Topical Cluster" of 10 High-Authority Blog Topics that specifically target the "Competitor Gaps" found.

For each topic, provide:
1. **SEO Title** — optimized for CTR and search intent
2. **Cluster Role** — (Pillar Content, Supporting Post, or Bridge to Transaction)
3. **Intent Type** — (Transactional, Commercial Research, Informational)
4. **Ranking Path** — why we can beat current incumbents for this specific query
5. **Entity Focus** — the main entity this post will "claim"

Format as a numbered list. No emojis.`;

export const PROMPT_STEP4 = (topic) => `Perform deep Keyword Research for the topic: "${topic}".

Analyze high-intent variations and long-tail opportunities.
For each keyword, provide:
1. **Target Keyword** (Use **keyword** format)
2. **Search Intent** (e.g., Problem-Aware, Solution-Aware)
3. **Position Potential** (High/Med/Low based on typical SERP patterns)
4. **Difficulty Score** (1-100)

Provide 10 keywords in a continuous numbered list (1, 2, 3... to 10). Do not reset the number for each item. No emojis.`;

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

export const PROMPT_STEP6 = (choice, outlineNote) => `Generate the ULTIMATE, HIGH-DENSITY blog post for: "${choice}".${outlineNote}

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
