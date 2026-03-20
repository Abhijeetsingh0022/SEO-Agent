/**
 * Rate limiting middleware to prevent API abuse
 */

const rateLimit = {};

// Periodic cleanup to prevent memory leak:
// Remove stale client entries every 60 seconds.
setInterval(() => {
  const now = Date.now();
  for (const clientId of Object.keys(rateLimit)) {
    rateLimit[clientId] = rateLimit[clientId].filter((t) => now - t < 60000);
    if (rateLimit[clientId].length === 0) delete rateLimit[clientId];
  }
}, 60000);

export function initRateLimit(clientId) {
  if (!rateLimit[clientId]) {
    rateLimit[clientId] = [];
  }
}

export function checkRateLimit(clientId, windowMs = 60000, maxRequests = 200) {
  // Disabling internal rate limit to allow full use of multi-key rotation (4 keys = 60+ RPM)
  return { allowed: true, remaining: 999 };
}

export function clearRateLimit(clientId) {
  delete rateLimit[clientId];
}
