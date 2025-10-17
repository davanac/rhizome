/**
 * Utility functions for profile-related operations
 */

/**
 * Get display name for a profile based on profile type and available data
 * @param profile - Profile object with user information
 * @returns Display name string
 * 
 * Display logic:
 * - For individuals: Show "firstname lastname" if available
 * - For collectifs: Show "collectif_name" if available  
 * - Fallback: Show "username" when the above are not available
 */
interface Profile {
  id?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  collectif_name?: string;
  profile_type?: string;
  [key: string]: unknown;
}

export function getProfileDisplayName(profile: Profile): string {
  if (!profile) {
    return 'Unknown';
  }

  // For collectif profiles, prioritize collectif_name
  if (profile.profile_type === 'collectif' && profile.collectif_name) {
    return profile.collectif_name;
  }

  // For individual profiles or when collectif_name is not available
  // Check if we have first_name or last_name
  if (profile.first_name || profile.last_name) {
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    // Only return full name if it's not empty
    if (fullName) {
      return fullName;
    }
  }

  // Fallback to username
  return profile.username || 'Unknown';
}