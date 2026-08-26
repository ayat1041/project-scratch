import redisClient from "@/infrastructure/cache/redis-client";

/**
 * Invalidates user base data cache (name, email, role, permissions, profile)
 */
export const invalidateUserBaseCache = async (
  userId: number,
): Promise<void> => {
  try {
    const promises = [
      redisClient.del(`userData-id:${userId}`),
      redisClient.del(`profileInfo-id:${userId}`),
    ];

    await Promise.all(promises);
  } catch {
    // Log error in production you might want to use a proper logging service
    // Don't throw the error - cache invalidation failure shouldn't break the main operation
  }
};

/**
 * Invalidates user bookmarks cache
 */
export const invalidateUserBookmarksCache = async (
  userId: number,
): Promise<void> => {
  try {
    await redisClient.del(`user-bookmarks:${userId}`);
  } catch {
    // Log error in production you might want to use a proper logging service
  }
};

/**
 * Invalidates user ratings cache
 */
export const invalidateUserRatingsCache = async (
  userId: number,
): Promise<void> => {
  try {
    await redisClient.del(`user-ratings:${userId}`);
  } catch {
    // Log error in production you might want to use a proper logging service
  }
};

/**
 * Invalidates user selected tasks cache
 */
export const invalidateUserTasksCache = async (
  userId: number,
): Promise<void> => {
  try {
    await redisClient.del(`user-tasks:${userId}`);
  } catch {
    // Log error in production you might want to use a proper logging service
  }
};

/**
 * Invalidates user owned tools cache
 */
export const invalidateUserOwnedToolsCache = async (
  userId: number,
): Promise<void> => {
  try {
    await redisClient.del(`user-owned-tools:${userId}`);
  } catch {
    // Log error in production you might want to use a proper logging service
  }
};

/**
 * Invalidates user data cache for a specific user
 * This should be called whenever user's bookmarked tools, rated tools, or selected tasks change
 * @deprecated Use specific cache invalidation functions instead
 */
export const invalidateUserDataCache = async (
  userId: number,
): Promise<void> => {
  try {
    const promises = [
      redisClient.del(`userData-id:${userId}`),
      redisClient.del(`profileInfo-id:${userId}`),
      redisClient.del(`user-bookmarks:${userId}`),
      redisClient.del(`user-ratings:${userId}`),
      redisClient.del(`user-tasks:${userId}`),
      redisClient.del(`user-owned-tools:${userId}`),
    ];

    await Promise.all(promises);
  } catch {
    // Log error in production you might want to use a proper logging service
    // Don't throw the error - cache invalidation failure shouldn't break the main operation
  }
};

/**
 * Invalidates bookmarks cache for multiple users
 */
export const invalidateMultipleUsersBookmarksCache = async (
  userIds: number[],
): Promise<void> => {
  try {
    const promises = userIds.map((userId) =>
      redisClient.del(`user-bookmarks:${userId}`),
    );
    await Promise.all(promises);
  } catch {
    // Log error in production you might want to use a proper logging service
  }
};

/**
 * Invalidates ratings cache for multiple users
 */
export const invalidateMultipleUsersRatingsCache = async (
  userIds: number[],
): Promise<void> => {
  try {
    const promises = userIds.map((userId) =>
      redisClient.del(`user-ratings:${userId}`),
    );
    await Promise.all(promises);
  } catch {
    // Log error in production you might want to use a proper logging service
  }
};

/**
 * Invalidates owned tools cache for multiple users
 */
export const invalidateMultipleUsersOwnedToolsCache = async (
  userIds: number[],
): Promise<void> => {
  try {
    const promises = userIds.map((userId) =>
      redisClient.del(`user-owned-tools:${userId}`),
    );
    await Promise.all(promises);
  } catch {
    // Log error in production you might want to use a proper logging service
  }
};

/**
 * Invalidates user data cache for multiple users
 * Useful when a tool is deleted and affects multiple users
 * @deprecated Use specific cache invalidation functions instead
 */
export const invalidateMultipleUsersCache = async (
  userIds: number[],
): Promise<void> => {
  try {
    const promises = userIds.flatMap((userId) => [
      redisClient.del(`userData-id:${userId}`),
      redisClient.del(`profileInfo-id:${userId}`),
      redisClient.del(`user-bookmarks:${userId}`),
      redisClient.del(`user-ratings:${userId}`),
      redisClient.del(`user-tasks:${userId}`),
      redisClient.del(`user-owned-tools:${userId}`),
    ]);

    await Promise.all(promises);
  } catch {
    // Log error in production you might want to use a proper logging service
    // Don't throw the error - cache invalidation failure shouldn't break the main operation
  }
};

/**
 * Invalidates ALL user data cache entries
 * This will delete all user-related cache keys
 * Use with caution - this clears cache for all users
 */
export const invalidateAllUsersCache = async (): Promise<void> => {
  try {
    // Delete all keys matching the patterns using the existing deleteKeysByPrefix method
    await Promise.all([
      redisClient.deleteKeysByPrefix("userData-id:"),
      redisClient.deleteKeysByPrefix("profileInfo-id:"),
      redisClient.deleteKeysByPrefix("user-bookmarks:"),
      redisClient.deleteKeysByPrefix("user-ratings:"),
      redisClient.deleteKeysByPrefix("user-tasks:"),
      redisClient.deleteKeysByPrefix("user-owned-tools:"),
    ]);
  } catch {
    // Log error in production you might want to use a proper logging service
    // Don't throw the error - cache invalidation failure shouldn't break the main operation
  }
};
