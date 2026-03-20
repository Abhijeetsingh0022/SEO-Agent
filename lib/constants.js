// ─── Step Definitions ─────────────────────────────────────────────
export const STEPS = [
  { id: 1, label: "Brand Analysis",    icon: "search",      short: "Analysis"   },
  { id: 2, label: "Competitor Intel",  icon: "bar-chart-2", short: "Competitors" },
  { id: 3, label: "Topic Generation",  icon: "lightbulb",   short: "Topics"     },
  { id: 4, label: "Keyword Research",  icon: "key",         short: "Keywords"   },
  { id: 5, label: "Blog Outline",      icon: "layout-list", short: "Outline"    },
  { id: 6, label: "Blog Post",         icon: "pen-line",    short: "Blog Post"  },
  { id: 7, label: "SEO Optimization",  icon: "rocket",      short: "SEO Meta"   },
];

export const SYSTEM_PROMPT = `You are an elite AI SEO strategist and blog content generation agent with deep expertise in modern search engine optimization. You apply Google's E-E-A-T principles (Experience, Expertise, Authoritativeness, Trustworthiness) to every output.

## Your Core Principles
- **Entity-based SEO**: Think in entities (people, places, brands, concepts), not just keywords. Connect topics semantically to build topical authority.
- **Search Intent Match**: Always identify and match the dominant search intent (informational, navigational, commercial, transactional) before structuring content.
- **E-E-A-T Compliance**: Write with genuine expertise. Cite credible concepts, use precise terminology, avoid vague generalizations.
- **No Hallucination**: Never fabricate statistics, ranking positions, search volumes, or tool pricing. If unsure, say so or provide a realistic estimate with clear attribution.
- **Human Tone**: Write like an expert writing for a knowledgeable peer — engaging, authoritative, and free of filler phrases ("In conclusion...", "Certainly!", "As an AI...").
- **Semantic Richness**: Use related terms, synonyms, and entity mentions naturally throughout content to improve topical coverage.

## Output Formatting
- Use ## for main sections, ### for sub-sections
- Use tables for comparisons, bullet points for lists, bold for key terms
- Structure FAQ sections in Q: / A: format for Featured Snippet eligibility
- Keep paragraphs short (3-4 sentences max) for readability and SERP snippet extraction

## Quality Bar
Every output must be: specific, actionable, verifiable, and genuinely useful to the reader. Generic platitudes are unacceptable.`;

// ─── Step Prompts ─────────────────────────────────────────────────
export const PROMPT_STEP1 = (url) => `Analyze the following website and provide a detailed brand analysis report:
URL: ${url}

Please search the web to actually visit and read this website, then provide:
1. **Niche / Industry** — exactly what sector this business operates in
2. **Target Audience** — demographics, interests, pain points
3. **Products / Services** — what they offer, pricing tiers if visible
4. **Existing Content Themes** — what topics they already blog or post about
5. **Brand Voice & Positioning** — tone, style, unique value proposition
6. **Key Differentiators** — what makes them stand out vs competitors

Format your response with clear ## headings and bullet points.`;

export const PROMPT_STEP2 = () => `Based on the website you just analyzed, now perform deep competitor research.

Search the web to identify and analyze the TOP 5 competitors in the same niche.

For each competitor provide:
- Their website URL
- Top-performing blog topics (check their blog/content section)
- Content formats they use (listicles, how-to guides, comparisons, case studies)
- Estimated posting frequency
- SEO strategies visible (keyword usage in titles, content length, heading structure)

Then provide:
- A **Competitor Summary Table** with columns: Competitor | Top Topics | Content Format | SEO Strategy | Strength
- **Key Insights** — 5 specific things that are clearly working in this niche from a content standpoint
- **Content Gaps** — topics competitors are NOT covering that present ranking opportunities`;

export const PROMPT_STEP3 = () => `Based on the website analysis and competitor research above, generate exactly 10 high-potential blog topic ideas.

For each topic provide:
1. **Blog Title** (compelling, SEO-friendly)
2. **Search Intent** (Informational / Navigational / Commercial / Transactional)
3. **Estimated Competition** (Low / Medium / High)
4. **Why it can rank** — specific reason this topic has ranking potential
5. **Target keyword** — the main keyword this post would target

Focus on:
- Gaps competitors haven't covered
- Trending topics in this niche
- Topics with high informational intent that build authority
- Long-tail opportunities with lower competition

Format as a numbered list with clear sections for each topic.`;

export const PROMPT_STEP4 = (choice) => `The user has selected: "${choice}"

Now perform comprehensive keyword research for this blog topic. Search the web for relevant keyword data.

Provide:
## Primary Keyword
- The single best primary keyword phrase with estimated monthly search volume

## Secondary Keywords (8–15)
List each with:
- Keyword phrase
- Search intent
- Estimated difficulty (1–100 scale)
- Why it was chosen

## Long-Tail Keywords (5–8)
Specific long-tail variations that are easier to rank for

## Question-Based Keywords
5–8 questions people ask about this topic (great for FAQ sections and featured snippets)

## Trending Angle
Based on current web trends, which keyword angle is gaining momentum right now and why?

Be specific with difficulty ratings and explain your keyword selection strategy.`;

export const PROMPT_STEP5 = (choice, keywordNote) => `Now create a detailed, SEO-optimized blog outline for the topic "${choice}".${keywordNote}

Use the keywords researched above to build the outline structure.

Provide:
## Blog Outline

**H1 Title** — (final SEO-optimized title, include primary keyword naturally)

### Introduction
- Hook idea (question, shocking stat, or relatable problem)
- What the reader will learn
- Estimated word count for intro: 150–200 words

### [H2 Section 1 — include keyword]
- H3 subpoint 1
- H3 subpoint 2

### [H2 Section 2 — include keyword variation]
- H3 subpoint 1
- H3 subpoint 2

[Continue for 4–6 H2 sections total]

### FAQ Section
List 5 specific questions with brief planned answers

### Conclusion + CTA
- Wrap-up angle
- CTA idea aligned with the website's product/service

## Additional Notes
- **Internal linking opportunities** — 3 suggested internal link anchor texts
- **External linking suggestions** — 2–3 authoritative domains to link to
- **Featured snippet opportunity** — one section to format for snippet capture
- **Estimated total word count** — with breakdown per section`;

export const PROMPT_STEP6 = (choice, outlineNote) => `Now write the COMPLETE, FULL blog post for "${choice}" following the approved outline.${outlineNote}

Requirements:
- **Length**: 1800–2500 words (write the FULL post, do not truncate)
- **Introduction**: Powerful hook (question or surprising fact), then establish the problem/opportunity
- **Body sections**: Follow the outline structure with H2 and H3 headings
- **Keyword placement**: Use primary keyword in H1, first paragraph, 2–3 H2s, and naturally throughout. NO keyword stuffing.
- **Tone**: Human, engaging, conversational but authoritative. Write like an expert talking to a friend.
- **Data & examples**: Include real-world examples and reference credible concepts (no made-up statistics)
- **FAQ Section**: Include at least 5 Q&As in schema-friendly format (Q: ... A: ...)
- **CTA**: End with a strong, relevant call-to-action that connects to the website's product or service
- **Formatting**: Use bullet points, bold key phrases, and short paragraphs for readability

Write the FULL blog post now — do not say "I will write..." just write it.`;

export const PROMPT_STEP7 = () => `Finally, provide the complete SEO optimization output for the blog post you just wrote.

## SEO Optimization Sheet

### Meta Title
(Exact text, max 60 characters — include primary keyword near the beginning)

### Meta Description
(Exact text, 150–160 characters — compelling, include primary + one secondary keyword, end with a soft CTA)

### URL Slug
(Lowercase, hyphens, no stop words, include primary keyword)

### Featured Image Idea
(Detailed description of the ideal featured image — style, content, text overlay if any)

### Schema Markup Recommendation
What schema type to use and why (Article, HowTo, FAQ, etc.)

### Internal Linking Map
3 specific pages on the website that this post should link to, with suggested anchor text for each

### External Linking Suggestions
3 specific authoritative external sources to cite with suggested anchor texts

### Social Media Titles
- Twitter/X version (under 280 chars)
- LinkedIn version (professional angle)
- Instagram caption hook (first line)

### Content Checklist
✅ checklist of 8–10 SEO best practices and whether this post satisfies each one`;
