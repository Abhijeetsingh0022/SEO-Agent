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

export function checkRateLimit(clientId, windowMs = 60000, maxRequests = 20) {
  initRateLimit(clientId);
  
  const now = Date.now();
  const window = windowMs;

  // Remove old requests outside window
  rateLimit[clientId] = rateLimit[clientId].filter(
    time => now - time < window
  );

  // Check if limit exceeded
  if (rateLimit[clientId].length >= maxRequests) {
    const oldestRequest = rateLimit[clientId][0];
    const retryAfter = Math.ceil((window - (now - oldestRequest)) / 1000);
    return {
      allowed: false,
      retryAfter,
      message: `Rate limit exceeded. Retry after ${retryAfter} seconds`,
    };
  }

  // Add current request
  rateLimit[clientId].push(now);
  
  return {
    allowed: true,
    remaining: maxRequests - rateLimit[clientId].length,
  };
}

export function clearRateLimit(clientId) {
  delete rateLimit[clientId];
}
