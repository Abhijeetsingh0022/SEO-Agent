/**
 * Automated quality checks at each step
 * - Accuracy validation
 * - Content quality scoring
 * - Performance monitoring
 * - Alert system
 */

export class QualityAssurance {
  static validateStep(stepId, output, expectedMetrics = {}) {
    const checks = {};

    switch (stepId) {
      case 1: // Brand Analysis
        checks.hasNiche = /niche|industry|sector/i.test(output);
        checks.hasAudience = /audience|target|demographic|persona/i.test(output);
        checks.hasUSP = /USP|proposition|value/i.test(output);
        checks.hasEntities = /entity|profile/i.test(output);
        checks.wordCount = this.validateWordCount(output, 500, 2000);
        break;

      case 2: // Competitor Intel
        checks.hasCompetitors = (output.match(/###\s+/g) || []).length >= 3;
        checks.hasStrategicFocus = /strategic focus:/i.test(output);
        checks.hasStrategicInsight = /strategic insight:|actionable insight:/i.test(output);
        checks.hasCounterMove = /your counter-move:|idea to outrank:/i.test(output);
        checks.hasTemporalGrounding = /\(\w+ \d{4}\)/.test(output); // Matches (Month Year)
        break;

      case 3: // Topic Generation
        checks.hasTenTopics = (output.match(/\d+\./g) || []).length >= 10;
        checks.hasIntentTypes = /informational|navigational|commercial|transactional/i.test(output);
        checks.hasArchitecture = /Architecture Role:/i.test(output);
        break;

      case 4: // Keyword Research
        checks.hasTenKeywords = (output.match(/\d+\./g) || []).length >= 10;
        checks.hasTargetKeywords = /Target Keyword:/i.test(output);
        checks.hasFunnelStages = /Funnel Stage:/i.test(output);
        checks.hasAIEligibility = /AI Overview Eligibility:/i.test(output);
        checks.hasTemporalOpportunity = /March 2026 Opportunity Note:/i.test(output);
        break;

      case 6: // Blog Post
        checks.wordCount = this.validateWordCount(output, 1800, 2500);
        checks.hasH1 = /^#\s+/m.test(output);
        checks.h2SectionCount = (output.match(/^##\s+/gm) || []).length;
        checks.hasH2Sections = checks.h2SectionCount >= 4;
        checks.hasCTA = /call to action|CTA|learn more|get started|sign up/i.test(output);
        checks.hasStructure = /introduction|conclusion|faq|question|answer/i.test(output);
        checks.hasMarch2026Anchor = /March 2026|2026 Core Update/i.test(output);
        break;

      default:
        checks.generic = true;
    }

    return {
      stepId,
      checksPerformed: Object.keys(checks).length,
      passedChecks: Object.values(checks).filter(v => v === true || (typeof v === 'object' && v.valid)).length,
      qualityScore: this.calculateQualityScore(checks),
      issues: this.identifyIssues(checks),
      recommendations: this.generateRecommendations(checks, stepId),
    };
  }

  static calculateQualityScore(checks) {
    const totalChecks = Object.keys(checks).length;
    const passedChecks = Object.values(checks).filter(
      v => v === true || (typeof v === 'object' && v.valid)
    ).length;

    if (totalChecks === 0) return 100;
    return parseFloat((passedChecks / totalChecks * 100).toFixed(1));
  }

  static identifyIssues(checks) {
    const issues = [];

    for (const [check, result] of Object.entries(checks)) {
      if (result === false) {
        issues.push(`Missing: ${check}`);
      } else if (typeof result === 'object' && !result.valid) {
        issues.push(`${check}: ${result.message}`);
      }
    }

    return issues;
  }

  static validateWordCount(text, min, max) {
    const wordCount = text.trim().split(/\s+/).length;
    return {
      valid: wordCount >= min && wordCount <= max,
      wordCount,
      message: `Expected ${min}-${max} words, got ${wordCount}`,
    };
  }

  static generateRecommendations(checks, stepId) {
    const recommendations = [];

    if (stepId === 6) { // Blog post
      if (!checks.hasH1) recommendations.push('Add an H1 heading');
      if (!checks.hasH2Sections || checks.h2SectionCount < 4) {
        recommendations.push('Add more H2 sections for better structure');
      }
      if (!checks.hasCTA) recommendations.push('Add a clear call-to-action');
    }

    return recommendations;
  }

  static createQualityReport(workflow) {
    const steps = workflow.steps || [];
    const qualityScores = steps.map(step => ({
      stepId: step.id,
      score: this.validateStep(step.id, step.text || '').qualityScore,
    }));

    const averageScore = qualityScores.length > 0 
      ? qualityScores.reduce((sum, s) => sum + s.score, 0) / qualityScores.length
      : 0;

    return {
      workflow_id: workflow.id,
      overall_quality_score: parseFloat(averageScore.toFixed(1)),
      step_breakdown: qualityScores,
      status: averageScore >= 80 ? 'APPROVED' : averageScore >= 60 ? 'NEEDS_REVIEW' : 'NEEDS_REVISION',
      timestamp: new Date().toISOString(),
    };
  }
}
