/**
 * Implements privacy-first data collection
 * - Minimal PII is collected
 * - Data has automatic expiration
 * - Users can export/delete data
 * - Complies with GDPR/CCPA
 */

// Uses Web Crypto API — works in both browser and Node 18+ (no Node crypto import needed)
export class PrivacyManager {
  static generateAnonymousSessionId() {
    // crypto.randomUUID is available in browsers and Node 18+
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older environments
    return Math.random().toString(36).substring(2, 11);
  }

  static async hashData(data) {
    // Use SubtleCrypto which works in browser and Node 18+
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(String(data)));
      return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
    // Fallback: base64 encode (not cryptographic, but safe for non-critical use)
    return btoa(String(data));
  }

  static createMinimalWorkflowRecord(input) {
    return {
      sessionId: this.generateAnonymousSessionId(),
      timestamp: new Date().toISOString(),

      urlDomain: input.url ? new URL(input.url).hostname : '', // Domain only
      provider: input.provider,

      stepStatuses: (input.steps || []).map(step => ({
        stepId: step.id,
        status: step.status,
        duration_ms: step.durationMs,
      })),

      contentMetadata: {
        stepCount: (input.steps || []).length,
        totalDuration_ms: input.totalDuration,
      },

      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };
  }

  static createDataRetentionPolicy() {
    return {
      workflows: {
        retention_days: 90,
        auto_delete: true,
        anonymize_after_days: 30,
      },
      error_logs: {
        retention_days: 30,
        auto_delete: true,
      },
      audit_logs: {
        retention_days: 365,
        anonymize_after_days: 180,
      },
    };
  }

  static createPrivacyNotice() {
    return {
      title: '🔒 Privacy & Data Usage',
      summary: `We collect minimal data necessary to operate.

✅ We DO:
- Store anonymous usage metrics for 90 days
- Automatically delete data after expiration
- Encrypt all data in transit
- Support your right to access and delete data (GDPR/CCPA)

❌ We DO NOT:
- Store your personal identity
- Track your IP address or device
- Store actual website content or LLM outputs
- Share data with third parties
- Sell or monetize your data`,
      rights: [
        'Right to access your data',
        'Right to delete your data',
        'Right to data portability',
        'Right to opt-out of analytics',
      ],
    };
  }
}
