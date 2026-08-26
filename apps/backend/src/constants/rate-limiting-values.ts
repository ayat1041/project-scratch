import { IS_DEVELOPMENT } from "@/constants/variables";

interface RateLimitConfig {
  time: number; // Time window in seconds
  maxRequests: number; // Maximum requests allowed in the time window
  checkEmail?: boolean; // Whether to check email for rate limiting key
  identityBodyFields?: string[]; // Additional request body fields for rate limiting key
}

// Keep public dev/staging/production environments protected.
// Only local NODE_ENV=development gets relaxed limits for manual testing.
const getRateLimit = (prodConfig: RateLimitConfig): RateLimitConfig => {
  if (IS_DEVELOPMENT) {
    return {
      time: 1, // 1 second
      maxRequests: 999999, // Nearly infinite requests in development
      checkEmail: prodConfig.checkEmail,
      identityBodyFields: prodConfig.identityBodyFields,
    };
  }
  return prodConfig;
};

export const RATELIMITING_VALUES = {
  // Authentication Module - Security critical endpoints
  AUTH: {
    SIGNUP: getRateLimit({
      time: 600,
      maxRequests: 3,
      checkEmail: true,
      identityBodyFields: ["name"],
    }), // 10 minutes, 3 attempts
    SIGNIN: getRateLimit({
      time: 60,
      maxRequests: 5,
      checkEmail: true,
    }), // 1 minute, 5 attempts
    FORGOT_PASSWORD: getRateLimit({
      time: 600,
      maxRequests: 3,
      checkEmail: true,
    }), // 10 minutes, 3 attempts
    REFRESH_TOKEN: getRateLimit({
      time: 60,
      maxRequests: 10,
      checkEmail: true,
    }), // 1 minute, 10 attempts
    CHANGE_PASSWORD: getRateLimit({
      time: 300,
      maxRequests: 3,
      checkEmail: true,
    }), // 5 minutes, 3 attempts
    SIGNOUT: getRateLimit({
      time: 60,
      maxRequests: 10,
      checkEmail: true,
    }), // 1 minute, 10 attempts
  },

  // User Management
  USER_MANAGEMENT: {
    UPDATE_PROFILE: getRateLimit({
      time: 120,
      maxRequests: 10,
    }), // 2 minutes, 10 updates
    DELETE_ACCOUNT: getRateLimit({
      time: 3600,
      maxRequests: 1,
    }), // 1 hour, 1 deletion
    CREATE_USER: getRateLimit({
      time: 300,
      maxRequests: 5,
    }), // 5 minutes, 5 users (admin only)
  },

  // Admin Operations
  ADMIN: {
    // Role and Permission Management
    CREATE_ROLE: getRateLimit({
      time: 60,
      maxRequests: 10,
    }), // 1 minute, 10 roles
    UPDATE_ROLE: getRateLimit({
      time: 60,
      maxRequests: 20,
    }), // 1 minute, 20 updates
    DELETE_ROLE: getRateLimit({
      time: 300,
      maxRequests: 5,
    }), // 5 minutes, 5 deletions
    CREATE_PERMISSION: getRateLimit({
      time: 60,
      maxRequests: 10,
    }), // 1 minute, 10 permissions
    UPDATE_PERMISSION: getRateLimit({
      time: 60,
      maxRequests: 20,
    }), // 1 minute, 20 updates

    // Cron Job Management
    CRON_JOB_OPERATION: getRateLimit({
      time: 60,
      maxRequests: 10,
    }), // 1 minute, 10 operations
  },

  // Public/General Endpoints
  PUBLIC: {
    GENERAL_API: getRateLimit({
      time: 60,
      maxRequests: 100,
    }), // 1 minute, 100 requests
    HEALTH_CHECK: getRateLimit({
      time: 10,
      maxRequests: 50,
    }), // 10 seconds, 50 requests
  },
};
