/**
 * Better Auth types and configuration for Gekko Community backend.
 * 
 * All Better Auth configuration is initialized in main.ts where
 * ConfigService is available for environment variable access.
 * 
 * This module exports types and configuration helpers used across
 * the authentication and authorization layers.
 */

// Type for the authenticated user from Better Auth session
export type BetterAuthUser = {
  id: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
};

/**
 * Configuration options for Better Auth initialization.
 * 
 * These values should be sourced from environment variables via
 * NestJS ConfigService, never hardcoded.
 */
export interface BetterAuthConfig {
  /** MongoDB connection URI */
  mongoUri: string;
  /** Frontend application URL */
  frontendUrl: string;
  /** Node environment (development/production) */
  nodeEnv: string;
};