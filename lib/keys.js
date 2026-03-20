/**
 * KeyRotator manages multiple API keys for different providers.
 * It implements round-robin rotation and handles temporary failure marking.
 */
export class KeyRotator {
  static #indices = {
    anthropic: 0,
    openai: 0,
    gemini: 0,
  };

  static #failedKeys = new Set();
  static #FAILURE_COOLDOWN = 2 * 60 * 1000; // 2 minutes (rate limits are often temporary)

  /**
   * Get all keys for a specific provider from process.env
   */
  static #getProviderKeys(provider) {
    const keys = [];
    const prefix = `${provider.toUpperCase()}_API_KEY`;
    
    // Check for both single key and numbered keys
    const singleKey = process.env[prefix];
    if (singleKey && !singleKey.includes('your-key-here')) {
      keys.push(singleKey);
    }

    let i = 1;
    while (true) {
      const key = process.env[`${prefix}_${i}`];
      if (!key) break;
      if (!key.includes('your-key-here') && !keys.includes(key)) {
        keys.push(key);
      }
      i++;
    }

    return keys;
  }

  /**
   * Gets the next available key for a provider
   */
  static getKey(provider) {
    const keys = this.#getProviderKeys(provider);
    if (keys.length === 0) return null;

    // Filter out failed keys that are still in cooldown
    const availableKeys = keys.filter(k => !this.#failedKeys.has(k));
    
    // If all keys failed, reset failed set (emergency)
    const targets = availableKeys.length > 0 ? availableKeys : keys;

    const index = this.#indices[provider] % targets.length;
    const key = targets[index];
    
    // Increment index for next time
    this.#indices[provider] = (index + 1) % targets.length;
    
    return key;
  }

  /**
   * Returns total number of configured keys for a provider
   */
  static countKeys(provider) {
    return this.#getProviderKeys(provider).length;
  }

  /**
   * Mark a key as failed (e.g., due to rate limiting)
   */
  static markFailed(key) {
    if (!key) return;
    this.#failedKeys.add(key);
    
    // Remove from failed set after cooldown
    setTimeout(() => {
      this.#failedKeys.delete(key);
    }, this.#FAILURE_COOLDOWN);
  }
}
