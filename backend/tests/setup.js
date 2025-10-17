import { beforeAll, afterAll } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-super-long-and-secure-key';

beforeAll(async () => {
  console.log('Setting up test environment...');
});

afterAll(async () => {
  console.log('Test environment cleaned up');
});

// Helper functions for unit tests (no database dependency)
global.testHelpers = {
  // Generate test JWT token
  generateTestJWT(payload = {}) {
    const jwt = require('jsonwebtoken');
    const defaultPayload = {
      userId: 'test-user-id',
      isAdmin: false
    };
    
    return jwt.sign({ ...defaultPayload, ...payload }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
  },

  // Create mock user data for testing
  createMockUser(userData = {}) {
    const defaultUser = {
      id: userData.id || 'test-user-id',
      email: userData.email || 'test@example.com',
      is_admin: userData.isAdmin || false,
      is_enabled: true,
      created_at: new Date(),
      updated_at: new Date()
    };
    return { ...defaultUser, ...userData };
  },

  // Create mock profile data for testing
  createMockProfile(userData = {}) {
    const profileData = {
      id: userData.id || 'test-profile-id',
      user_id: userData.user_id || 'test-user-id',
      first_name: userData.first_name || 'Test',
      last_name: userData.last_name || 'User',
      username: userData.username || 'testuser',
      bio: userData.bio || 'Test bio',
      avatar_url: userData.avatar_url || null,
      profile_type_id: userData.profile_type_id || 1,
      wallet_address: userData.wallet_address || '0x1234567890123456789012345678901234567890',
      created_at: new Date(),
      updated_at: new Date()
    };
    return { ...profileData, ...userData };
  }
};