/**
 * Detects and flags potential hallucinations in LLM responses
 * - Pattern-based detection
 * - Confidence scoring
 * - Citation validation
 */

const HALLUCINATION_PATTERNS = {
  unknownKnowledge: [
    /I don't have (?:access to|information about)/i,
    /As of my knowledge cutoff/i,
    /I cannot provide real-time/i,
    /this information is not available/i,
    /I don't have access to current/i,
  ],

  uncertainty: [
    /it(?:'s| is) likely that/i,
    /it(?:'s| is) possible that/i,
    /I(?:')(?:m|: think) probably/i,
    /I am not entirely sure/i,
    /based on my knowledge/i,
  ],

  fabrication: [
    /\[no data available\]/i,
    /\[citation needed\]/i,
    /(?:approximately|roughly|around) \d+%/i,
    /unknown statistic/i,
  ],

  disconnected: [
    /(?:also|furthermore), \w+\s+(?:has|have|is|was|are|were)/i,
    /unrelated(?:ly)?[^.]*\./i,
  ],
};

const CONFIDENCE_THRESHOLDS = {
  LOW: 0.4,
  MEDIUM: 0.7,
  HIGH: 0.9,
};

export class HallucinationDetector {
  static analyze(response) {
    const flags = [];
    let hazardScore = 0;

    const unknownMatches = this.findPatternMatches(
      response,
      HALLUCINATION_PATTERNS.unknownKnowledge
    );
    if (unknownMatches > 0) {
      flags.push({
        type: 'UNKNOWN_KNOWLEDGE',
        count: unknownMatches,
        severity: 'MEDIUM',
      });
      hazardScore += 0.2;
    }

    const uncertaintyMatches = this.findPatternMatches(
      response,
      HALLUCINATION_PATTERNS.uncertainty
    );
    if (uncertaintyMatches > 0) {
      flags.push({
        type: 'UNCERTAIN_LANGUAGE',
        count: uncertaintyMatches,
        severity: 'LOW',
      });
      hazardScore += 0.1;
    }

    const fabricationMatches = this.findPatternMatches(
      response,
      HALLUCINATION_PATTERNS.fabrication
    );
    if (fabricationMatches > 0) {
      flags.push({
        type: 'FABRICATION_RISK',
        count: fabricationMatches,
        severity: 'HIGH',
      });
      hazardScore += 0.4;
    }

    const sections = response.split(/\n\n+/);
    const disconnectedCount = sections.filter(section =>
      HALLUCINATION_PATTERNS.disconnected.some(p => p.test(section))
    ).length;

    if (disconnectedCount > 0) {
      flags.push({
        type: 'DISCONNECTED_REASONING',
        count: disconnectedCount,
        severity: 'LOW',
      });
      hazardScore += 0.05 * disconnectedCount;
    }

    const urlCount = (response.match(/https?:\/\/\S+/g) || []).length;
    const paragraphs = response.split(/\n\n+/).length;
    const citationDensity = urlCount / paragraphs;

    if (citationDensity < 0.1) {
      flags.push({
        type: 'LOW_CITATION_DENSITY',
        citationRatio: citationDensity.toFixed(2),
        severity: 'MEDIUM',
      });
      hazardScore += 0.15;
    }

    hazardScore = Math.min(1, hazardScore);

    let confidenceLevel = 'HIGH';
    if (hazardScore > CONFIDENCE_THRESHOLDS.HIGH) {
      confidenceLevel = 'LOW';
    } else if (hazardScore > CONFIDENCE_THRESHOLDS.MEDIUM) {
      confidenceLevel = 'MEDIUM';
    }

    return {
      hazardScore: parseFloat(hazardScore.toFixed(3)),
      confidenceLevel,
      flags,
      recommendation: this.getRecommendation(hazardScore, flags),
      shouldRegenerate: hazardScore > 0.6,
    };
  }

  static findPatternMatches(text, patterns) {
    return patterns.reduce((count, pattern) => {
      const matches = text.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  static getRecommendation(hazardScore, flags) {
    if (hazardScore > 0.7) {
      return 'HIGH RISK: Consider regenerating with stronger instructions';
    }
    if (hazardScore > 0.4) {
      return 'MEDIUM RISK: Review and verify key claims before publishing';
    }
    if (hazardScore > 0.0) {
      return 'LOW RISK: Minor quality issues detected';
    }
    return 'APPROVED: Response quality meets standards';
  }
}
