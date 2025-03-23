import rateLimit from 'express-rate-limit';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

/**
 * Rate limiting configuration options
 */
export interface RateLimitOptions {
  /** Maximum number of requests within the window */
  max: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Message to return when rate limit is exceeded */
  message?: string;
  /** Status code to return when rate limit is exceeded */
  statusCode?: number;
  /** Whether to skip rate limiting in development mode */
  skipInDevelopment?: boolean;
}

/**
 * Default rate limit options
 */
const defaultOptions: RateLimitOptions = {
  max: 5, // 5 requests
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests, please try again later.',
  statusCode: 429, // Too Many Requests
  skipInDevelopment: true
};

/**
 * In-memory store for rate limiting
 * This is a simple implementation that will be reset when the server restarts
 * For production, consider using a more persistent store like Redis
 */
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Creates a rate limiting middleware for SvelteKit API endpoints
 * @param options Rate limiting configuration options
 * @returns A SvelteKit request handler middleware
 */
export function createRateLimit(customOptions: Partial<RateLimitOptions> = {}): RequestHandler {
  const options = { ...defaultOptions, ...customOptions };
  
  return async ({ request, getClientAddress }) => {
    // Skip rate limiting in development mode if configured
    if (options.skipInDevelopment && process.env.NODE_ENV === 'development') {
      return;
    }
    
    const ip = getClientAddress();
    const now = Date.now();
    
    // Get or create rate limit data for this IP
    let limitData = ipRequestCounts.get(ip);
    
    if (!limitData || now > limitData.resetTime) {
      // If no data exists or the window has expired, create new data
      limitData = {
        count: 0,
        resetTime: now + options.windowMs
      };
    }
    
    // Increment request count
    limitData.count++;
    
    // Store updated data
    ipRequestCounts.set(ip, limitData);
    
    // Check if rate limit is exceeded
    if (limitData.count > options.max) {
      // Calculate remaining time until reset
      const resetInSeconds = Math.ceil((limitData.resetTime - now) / 1000);
      
      // Return rate limit exceeded response
      return json({
        success: false,
        error: options.message,
        retryAfter: resetInSeconds
      }, {
        status: options.statusCode,
        headers: {
          'Retry-After': String(resetInSeconds),
          'X-RateLimit-Limit': String(options.max),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(limitData.resetTime / 1000))
        }
      });
    }
    
    // Add rate limit headers to the response
    return {
      headers: {
        'X-RateLimit-Limit': String(options.max),
        'X-RateLimit-Remaining': String(Math.max(0, options.max - limitData.count)),
        'X-RateLimit-Reset': String(Math.ceil(limitData.resetTime / 1000))
      }
    };
  };
}
