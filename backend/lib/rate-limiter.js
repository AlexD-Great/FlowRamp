/**
 * Simple in-memory rate limiter middleware
 * For production, consider using Redis-based rate limiting
 */

class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map();
  }

  middleware() {
    return (req, res, next) => {
      const identifier = req.user?.uid || req.ip || 'anonymous';
      const now = Date.now();
      
      // Clean up old entries
      if (this.requests.size > 10000) {
        this.cleanup(now);
      }

      const userRequests = this.requests.get(identifier) || [];
      const recentRequests = userRequests.filter(timestamp => now - timestamp < this.windowMs);

      if (recentRequests.length >= this.maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Max ${this.maxRequests} requests per ${this.windowMs / 1000} seconds.`,
          retryAfter: Math.ceil((recentRequests[0] + this.windowMs - now) / 1000),
        });
      }

      recentRequests.push(now);
      this.requests.set(identifier, recentRequests);
      
      next();
    };
  }

  cleanup(now) {
    for (const [identifier, timestamps] of this.requests.entries()) {
      const recentRequests = timestamps.filter(timestamp => now - timestamp < this.windowMs);
      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }
}

// Create different rate limiters for different endpoints
const generalLimiter = new RateLimiter(60000, 100); // 100 requests per minute
const strictLimiter = new RateLimiter(60000, 10);   // 10 requests per minute for sensitive operations
const authLimiter = new RateLimiter(300000, 5);     // 5 requests per 5 minutes for auth

module.exports = {
  RateLimiter,
  generalLimiter: generalLimiter.middleware(),
  strictLimiter: strictLimiter.middleware(),
  authLimiter: authLimiter.middleware(),
};
