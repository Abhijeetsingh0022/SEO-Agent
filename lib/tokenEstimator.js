/**
 * Advanced token counting and estimation
 * - Accurate token prediction before API calls
 * - Cost calculation
 * - Optimization recommendations
 */

const PROVIDER_CONFIG = {
  anthropic: {
    model: 'claude-opus-4-5',
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.075,
    maxTokens: 200000,
  },
  openai: {
    model: 'gpt-4o',
    inputCostPer1k: 0.03,
    outputCostPer1k: 0.06,
    maxTokens: 128000,
  },
  gemini: {
    model: 'gemini-3-flash-preview',
    inputCostPer1k: 0.00075,
    outputCostPer1k: 0.003,
    maxTokens: 1000000,
  },
};

export class TokenEstimator {
  static countTokens(text) {
    if (typeof text !== 'string') return 0;

    const words = text.trim().split(/\s+/).length;
    const specialChars = (text.match(/[^\w\s]/g) || []).length;
    const newlines = (text.match(/\n/g) || []).length;

    return Math.ceil(
      words * 0.77 +
      specialChars * 0.5 +
      newlines * 0.1
    );
  }

  static estimateWorkflowCost(workflow, provider = 'anthropic') {
    const config = PROVIDER_CONFIG[provider];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (let step = 1; step <= 7; step++) {
      // getPromptLength / getEstimatedOutputLength return estimated word counts.
      // We use them directly as token approximations instead of passing numbers
      // through countTokens() which expects a string.
      const inputTokens = Math.ceil(this.getPromptLength(step) * 0.77);
      const outputTokens = Math.ceil(this.getEstimatedOutputLength(step) * 0.77);

      totalInputTokens += inputTokens;
      totalOutputTokens += outputTokens;
    }

    return {
      provider,
      model: config.model,
      totalInputTokens,
      totalOutputTokens,
      estimatedInputCost: (totalInputTokens * config.inputCostPer1k) / 1000,
      estimatedOutputCost: (totalOutputTokens * config.outputCostPer1k) / 1000,
      estimatedTotalCost: (
        (totalInputTokens * config.inputCostPer1k +
        totalOutputTokens * config.outputCostPer1k) / 1000
      ),
    };
  }

  static getPromptLength(step) {
    const lengths = {
      1: 800,   // Brand analysis
      2: 600,   // Competitor research
      3: 700,   // Topic generation
      4: 900,   // Keyword research
      5: 1200,  // Blog outline
      6: 1500,  // Full blog post
      7: 500,   // SEO optimization
    };
    return lengths[step] || 500;
  }

  static getEstimatedOutputLength(step) {
    const lengths = {
      1: 1500,  // Analysis
      2: 2000,  // Competitor analysis
      3: 1200,  // 10 topics
      4: 1800,  // Keywords
      5: 2000,  // Outline
      6: 2500,  // Blog post
      7: 800,   // SEO metadata
    };
    return lengths[step] || 1000;
  }

  static compareProviders(workflow) {
    const costs = {};
    for (const provider of Object.keys(PROVIDER_CONFIG)) {
      costs[provider] = this.estimateWorkflowCost(workflow, provider);
    }

    let cheapest = null;
    let lowestCost = Infinity;
    for (const [provider, data] of Object.entries(costs)) {
      if (data.estimatedTotalCost < lowestCost) {
        cheapest = provider;
        lowestCost = data.estimatedTotalCost;
      }
    }

    return {
      costs,
      recommendation: `${cheapest} is most cost-effective at $${lowestCost.toFixed(2)}`,
      savings: Object.entries(costs).map(([p, data]) => ({
        provider: p,
        cost: data.estimatedTotalCost.toFixed(2),
      })),
    };
  }
}
