/**
 * Comprehensive input sanitization
 * - XSS prevention
 * - Prompt injection prevention
 * - SQL injection prevention
 * - Path traversal prevention
 */

export class SecureSanitizer {
  // XSS PREVENTION
  static sanitizeHTML(input) {
    if (typeof input !== 'string') return '';
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    
    return input.replace(/[&<>"']/g, char => map[char]);
  }

  // PROMPT INJECTION PREVENTION
  static sanitizePromptInput(input) {
    let sanitized = input
      .replace(/(?:ignore|forget|disregard).*(?:instructions|prompt|system)/gi, '')
      .replace(/you are now|pretend you are|act as if/gi, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/execute|run|eval|compile/gi, 'perform')
      .trim();

    if (sanitized.length > 5000) {
      throw new Error('Input exceeds maximum length');
    }

    return sanitized;
  }

  // SQL INJECTION PREVENTION
  static escapeSQLString(input) {
    return input.replace(/'/g, "''").replace(/\\/g, '\\\\');
  }

  // PATH TRAVERSAL PREVENTION
  static sanitizePath(path) {
    const sanitized = path
      .replace(/\.\.\//g, '')
      .replace(/\.\.[\\]/g, '')
      .replace(/^[a-z]:/i, '')
      .replace(/[<>:"|?*\x00-\x1f]/g, '');

    return sanitized;
  }

  // URL VALIDATION & SANITIZATION
  static sanitizeURL(url) {
    try {
      const parsed = new URL(url);

      const allowedProtocols = ['http:', 'https:'];
      if (!allowedProtocols.includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }

      if (this.isPrivateIP(parsed.hostname)) {
        throw new Error('Private IP addresses not allowed');
      }

      return parsed.href;
    } catch (e) {
      throw new Error(`Invalid URL: ${e.message}`);
    }
  }

  static isPrivateIP(hostname) {
    const privatePatterns = [
      /^localhost$/i,
      /^127\./,
      /^::1$/,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
    ];

    return privatePatterns.some(p => p.test(hostname));
  }

  // INPUT COMPLEXITY CHECK
  static checkInputComplexity(input) {
    const analysis = {
      length: input.length,
      lines: input.split('\n').length,
      uniqueChars: new Set(input).size,
      specialChars: (input.match(/[^a-zA-Z0-9\s]/g) || []).length,
      hasURLs: /https?:\/\//.test(input),
      hasCode: /```|<script|eval|exec/.test(input),
      isSuspicious: false,
    };

    if (analysis.specialChars / analysis.length > 0.3) {
      analysis.isSuspicious = true;
      analysis.reason = 'Unusually high special character density';
    }

    if (analysis.hasCode) {
      analysis.isSuspicious = true;
      analysis.reason = 'Contains code patterns';
    }

    return analysis;
  }
}
