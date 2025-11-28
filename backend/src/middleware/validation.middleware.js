// path: /src/middleware/validation.middleware.js
import validator from 'validator';

/**
 * Middleware pour valider et sécuriser les données de profil
 * Protège contre les attaques XSS et valide les URLs
 */
export async function validateProfileData(req, reply) {
  try {
    const { 
      bio, 
      website, 
      first_name, 
      last_name, 
      username,
      expertise,
      collectif_name
    } = req.body;
    
    // Validate and sanitize text fields
    if (bio !== undefined) {
      if (typeof bio !== 'string') {
        return reply.status(400).send({
          success: false,
          message: "Bio must be a string",
          errorCode: "bio-invalid-type",
          errorKey: 400101
        });
      }
      
      // Check length before sanitization
      if (bio.length > 1000) {
        return reply.status(400).send({
          success: false,
          message: "Bio must be less than 1000 characters",
          errorCode: "bio-too-long",
          errorKey: 400102
        });
      }
      
      // Remove dangerous protocols (XSS protection)
      // Note: HTML escaping removed - React handles XSS protection at render time
      let sanitizedBio = bio;
      sanitizedBio = sanitizedBio.replace(/javascript:/gi, 'removed:');
      sanitizedBio = sanitizedBio.replace(/data:/gi, 'removed:');
      sanitizedBio = sanitizedBio.replace(/vbscript:/gi, 'removed:');
      req.body.bio = sanitizedBio;
    }
    
    // Validate text fields with length limits
    const textFields = {
      first_name: { max: 50, field: 'First name' },
      last_name: { max: 50, field: 'Last name' },
      username: { max: 30, field: 'Username' },
      expertise: { max: 100, field: 'Expertise' },
      collectif_name: { max: 100, field: 'Collectif name' }
    };
    
    for (const [fieldName, config] of Object.entries(textFields)) {
      const value = req.body[fieldName];
      if (value !== undefined) {
        if (typeof value !== 'string') {
          return reply.status(400).send({
            success: false,
            message: `${config.field} must be a string`,
            errorCode: `${fieldName}-invalid-type`,
            errorKey: 400103
          });
        }
        
        if (value.length > config.max) {
          return reply.status(400).send({
            success: false,
            message: `${config.field} must be less than ${config.max} characters`,
            errorCode: `${fieldName}-too-long`,
            errorKey: 400104
          });
        }
        
        // Remove dangerous protocols (XSS protection)
        // Note: HTML escaping removed - React handles XSS protection at render time
        let sanitized = value;
        sanitized = sanitized.replace(/javascript:/gi, 'removed:');
        sanitized = sanitized.replace(/data:/gi, 'removed:');
        sanitized = sanitized.replace(/vbscript:/gi, 'removed:');
        req.body[fieldName] = sanitized;
      }
    }
    
    // Special validation for username (alphanumeric + underscore/dash)
    if (username !== undefined && username.trim() !== '') {
      if (!validator.matches(username, /^[a-zA-Z0-9_-]+$/)) {
        return reply.status(400).send({
          success: false,
          message: "Username can only contain letters, numbers, underscores, and dashes",
          errorCode: "username-invalid-characters",
          errorKey: 400105
        });
      }
    }
    
    // Validate website URL
    if (website !== undefined && website.trim() !== '') {
      if (!validator.isURL(website, { 
        protocols: ['http', 'https'],
        require_protocol: true 
      })) {
        return reply.status(400).send({
          success: false,
          message: "Website must be a valid URL (http:// or https://)",
          errorCode: "website-invalid-url",
          errorKey: 400106
        });
      }
      
      // Keep URL as-is after validation
      req.body.website = website;
    }
    
    // Validation passed, continue to next handler
    
  } catch (error) {
    console.log('=== error === validation.middleware.js === validateProfileData === key: 500101 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');
    
    return reply.status(500).send({
      success: false,
      message: 'Internal server error during validation',
      errorCode: "validation-error",
      errorKey: 500101
    });
  }
}

/**
 * Middleware pour valider et sécuriser les données de projet
 * Protège contre les attaques XSS et valide les données métier
 */
export async function validateProjectData(req, reply) {
  try {
    const { 
      title, 
      description, 
      category,
      client,
      testimonial 
    } = req.body;
    
    // Validate required fields
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return reply.status(400).send({
          success: false,
          message: "Project title is required and must be a non-empty string",
          errorCode: "title-required",
          errorKey: 400201
        });
      }
      
      if (title.length > 100) {
        return reply.status(400).send({
          success: false,
          message: "Project title must be less than 100 characters",
          errorCode: "title-too-long",
          errorKey: 400202
        });
      }
      
      // Remove dangerous protocols (XSS protection)
      // Note: HTML escaping removed - React handles XSS protection at render time
      let sanitizedTitle = title;
      sanitizedTitle = sanitizedTitle.replace(/javascript:/gi, 'removed:');
      sanitizedTitle = sanitizedTitle.replace(/data:/gi, 'removed:');
      sanitizedTitle = sanitizedTitle.replace(/vbscript:/gi, 'removed:');
      req.body.title = sanitizedTitle;
    }
    
    // Validate and sanitize optional text fields
    const textFields = {
      description: { max: 2000, field: 'Description' },
      category: { max: 50, field: 'Category' },
      client: { max: 100, field: 'Client' },
      testimonial: { max: 1000, field: 'Testimonial' }
    };
    
    for (const [fieldName, config] of Object.entries(textFields)) {
      const value = req.body[fieldName];
      if (value !== undefined) {
        if (typeof value !== 'string') {
          return reply.status(400).send({
            success: false,
            message: `${config.field} must be a string`,
            errorCode: `${fieldName}-invalid-type`,
            errorKey: 400203
          });
        }
        
        if (value.length > config.max) {
          return reply.status(400).send({
            success: false,
            message: `${config.field} must be less than ${config.max} characters`,
            errorCode: `${fieldName}-too-long`,
            errorKey: 400204
          });
        }
        
        // Remove dangerous protocols (XSS protection)
        // Note: HTML escaping removed - React handles XSS protection at render time
        let sanitized = value;
        sanitized = sanitized.replace(/javascript:/gi, 'removed:');
        sanitized = sanitized.replace(/data:/gi, 'removed:');
        sanitized = sanitized.replace(/vbscript:/gi, 'removed:');
        req.body[fieldName] = sanitized;
      }
    }
    
    // Validation passed, continue to next handler
    
  } catch (error) {
    console.log('=== error === validation.middleware.js === validateProjectData === key: 500102 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');
    
    return reply.status(500).send({
      success: false,
      message: 'Internal server error during validation',
      errorCode: "validation-error",
      errorKey: 500102
    });
  }
}

/**
 * Middleware pour valider les données de liens de profil
 * Valide les URLs des réseaux sociaux et sites web
 */
export async function validateProfileLinks(req, reply) {
  try {
    const socialFields = [
      'linkedin', 'github', 'twitter', 'instagram', 
      'facebook', 'youtube', 'discord', 'behance', 
      'dribbble', 'strava', 'spotify'
    ];
    
    for (const field of socialFields) {
      const url = req.body[field];
      if (url !== undefined) {
        if (typeof url !== 'string') {
          return reply.status(400).send({
            success: false,
            message: `${field} must be a string`,
            errorCode: `${field}-invalid-type`,
            errorKey: 400301
          });
        }
        
        if (url.trim() === '') {
          continue; // Skip empty strings
        }
        
        if (!validator.isURL(url, { 
          protocols: ['http', 'https'],
          require_protocol: true 
        })) {
          return reply.status(400).send({
            success: false,
            message: `${field} must be a valid URL (http:// or https://)`,
            errorCode: `${field}-invalid-url`,
            errorKey: 400302
          });
        }
        
        // Additional validation for specific platforms
        // Parse URL to validate actual hostname (prevents bypass attacks)
        try {
          const parsedUrl = new URL(url);
          const hostname = parsedUrl.hostname.toLowerCase();

          // Define allowed domains for each platform
          const platformDomains = {
            'linkedin': ['linkedin.com', 'www.linkedin.com'],
            'github': ['github.com', 'www.github.com', 'gist.github.com'],
            'twitter': ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com'],
            'instagram': ['instagram.com', 'www.instagram.com'],
            'facebook': ['facebook.com', 'www.facebook.com', 'fb.com', 'www.fb.com'],
            'youtube': ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'],
            'discord': ['discord.com', 'www.discord.com', 'discord.gg'],
            'behance': ['behance.net', 'www.behance.net'],
            'dribbble': ['dribbble.com', 'www.dribbble.com'],
            'strava': ['strava.com', 'www.strava.com'],
            'spotify': ['spotify.com', 'www.spotify.com', 'open.spotify.com']
          };

          // Check if this field requires domain validation
          if (platformDomains[field]) {
            const allowedDomains = platformDomains[field];
            const isValidDomain = allowedDomains.some(domain => {
              // Exact match or subdomain match
              return hostname === domain || hostname.endsWith('.' + domain);
            });

            if (!isValidDomain) {
              return reply.status(400).send({
                success: false,
                message: `${field} URL must be from ${allowedDomains[0]} domain`,
                errorCode: `${field}-invalid-domain`,
                errorKey: 400303
              });
            }
          }
        } catch (parseError) {
          // URL parsing failed (should not happen after validator.isURL check)
          return reply.status(400).send({
            success: false,
            message: `${field} contains an invalid URL`,
            errorCode: `${field}-parse-error`,
            errorKey: 400305
          });
        }
      }
    }
    
    // Validation passed, continue to next handler
    
  } catch (error) {
    console.log('=== error === validation.middleware.js === validateProfileLinks === key: 500103 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');
    
    return reply.status(500).send({
      success: false,
      message: 'Internal server error during validation',
      errorCode: "validation-error",
      errorKey: 500103
    });
  }
}