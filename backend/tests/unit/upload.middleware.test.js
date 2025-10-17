import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { validateImageUpload, validateFileAccess } from '../../src/middleware/upload.middleware.js';
import { Readable } from 'stream';

describe('Upload Security Middleware Unit Tests', () => {
  let mockReq, mockReply;
  
  beforeEach(() => {
    mockReq = { 
      params: {},
      isMultipart: vi.fn()
    };
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };
  });

  describe('validateImageUpload', () => {
    it('should reject non-multipart requests', async () => {
      mockReq.isMultipart.mockReturnValue(false);
      
      await validateImageUpload(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: "invalid-content-type"
        })
      );
    });
    
    it('should reject request with no file', async () => {
      mockReq.isMultipart.mockReturnValue(true);
      mockReq.file = vi.fn().mockResolvedValue(null);
      
      await validateImageUpload(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: "no-file-uploaded"
        })
      );
    });
    
    it('should reject invalid MIME type', async () => {
      mockReq.isMultipart.mockReturnValue(true);
      mockReq.file = vi.fn().mockResolvedValue({
        filename: 'test.txt',
        mimetype: 'text/plain',
        file: createMockStream('Hello World')
      });
      
      await validateImageUpload(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: "invalid-file-type"
        })
      );
    });
    
    it('should reject invalid file extension', async () => {
      mockReq.isMultipart.mockReturnValue(true);
      mockReq.file = vi.fn().mockResolvedValue({
        filename: 'test.exe',
        mimetype: 'image/jpeg',
        file: createMockStream(createJpegHeader())
      });
      
      await validateImageUpload(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: "invalid-file-extension"
        })
      );
    });
    
    it('should reject filename that is too long', async () => {
      const longFilename = 'a'.repeat(101) + '.jpg';
      mockReq.isMultipart.mockReturnValue(true);
      mockReq.file = vi.fn().mockResolvedValue({
        filename: longFilename,
        mimetype: 'image/jpeg',
        file: createMockStream(createJpegHeader())
      });
      
      await validateImageUpload(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: "filename-too-long"
        })
      );
    });
    
    it('should reject file that is too large', async () => {
      // Create a 6MB file (over 5MB limit)
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 'A');
      
      mockReq.isMultipart.mockReturnValue(true);
      mockReq.file = vi.fn().mockResolvedValue({
        filename: 'large.jpg',
        mimetype: 'image/jpeg',
        file: createMockStream(largeBuffer)
      });
      
      await validateImageUpload(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: "file-too-large"
        })
      );
    });
    
    it('should reject file with invalid image signature', async () => {
      // Text content with image extension and MIME type
      const fakeImageContent = Buffer.from('This is not an image');
      
      mockReq.isMultipart.mockReturnValue(true);
      mockReq.file = vi.fn().mockResolvedValue({
        filename: 'fake.jpg',
        mimetype: 'image/jpeg',
        file: createMockStream(fakeImageContent)
      });
      
      await validateImageUpload(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: "invalid-image-signature"
        })
      );
    });
    
    it('should accept valid JPEG image', async () => {
      const jpegBuffer = createJpegHeader();
      
      mockReq.isMultipart.mockReturnValue(true);
      mockReq.file = vi.fn().mockResolvedValue({
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
        file: createMockStream(jpegBuffer)
      });
      
      await validateImageUpload(mockReq, mockReply);
      
      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReq.validatedFile).toBeDefined();
      expect(mockReq.validatedFile.mimetype).toBe('image/jpeg');
      expect(mockReq.validatedFile.secureFilename).toMatch(/^[0-9]+-[a-f0-9]+\.jpg$/);
    });
    
    it('should accept valid PNG image', async () => {
      const pngBuffer = createPngHeader();
      
      mockReq.isMultipart.mockReturnValue(true);
      mockReq.file = vi.fn().mockResolvedValue({
        filename: 'test.png',
        mimetype: 'image/png',
        file: createMockStream(pngBuffer)
      });
      
      await validateImageUpload(mockReq, mockReply);
      
      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReq.validatedFile).toBeDefined();
      expect(mockReq.validatedFile.secureFilename).toMatch(/^[0-9]+-[a-f0-9]+\.png$/);
    });
  });
  
  describe('validateFileAccess', () => {
    it('should reject missing filename parameter', () => {
      mockReq.params = {};
      
      validateFileAccess(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: 'invalid-filename-parameter'
        })
      );
    });
    
    it('should reject directory traversal attempts', () => {
      mockReq.params = { filename: '../../../etc/passwd' };
      
      validateFileAccess(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: 'directory-traversal-attempt'
        })
      );
    });
    
    it('should reject filenames with directory separators', () => {
      mockReq.params = { filename: 'uploads/secret.jpg' };
      
      validateFileAccess(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: 'directory-traversal-attempt'
        })
      );
    });
    
    it('should reject invalid filename format', () => {
      mockReq.params = { filename: 'invalidfilename.jpg' };
      
      validateFileAccess(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: 'invalid-filename-format'
        })
      );
    });
    
    it('should accept valid filename format', () => {
      const validFilename = '1638360000000-a1b2c3d4e5f6abcd.jpg';
      mockReq.params = { filename: validFilename };
      
      validateFileAccess(mockReq, mockReply);
      
      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReq.sanitizedFilename).toBe(validFilename);
    });
    
    it('should accept various valid image extensions', () => {
      const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      
      extensions.forEach(ext => {
        const filename = `1638360000000-a1b2c3d4e5f6abcd.${ext}`;
        mockReq.params = { filename };
        
        // Reset mocks
        mockReply.status.mockClear();
        
        validateFileAccess(mockReq, mockReply);
        
        expect(mockReply.status).not.toHaveBeenCalled();
        expect(mockReq.sanitizedFilename).toBe(filename);
      });
    });
  });
  
  describe('Security Attack Scenarios', () => {
    it('should detect and reject executable files disguised as images', async () => {
      // Windows PE executable signature: MZ
      const maliciousBuffer = Buffer.concat([
        Buffer.from([0x4D, 0x5A]), // MZ signature
        Buffer.from('fake image content')
      ]);
      
      mockReq.isMultipart.mockReturnValue(true);
      mockReq.file = vi.fn().mockResolvedValue({
        filename: 'malware.jpg',
        mimetype: 'image/jpeg',
        file: createMockStream(maliciousBuffer)
      });
      
      await validateImageUpload(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: "invalid-image-signature"
        })
      );
    });
    
    it('should sanitize malicious filenames', async () => {
      const jpegBuffer = createJpegHeader();
      
      mockReq.isMultipart.mockReturnValue(true);
      mockReq.file = vi.fn().mockResolvedValue({
        filename: '../../evil<script>.jpg',
        mimetype: 'image/jpeg',
        file: createMockStream(jpegBuffer)
      });
      
      await validateImageUpload(mockReq, mockReply);
      
      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReq.validatedFile.secureFilename).not.toContain('..');
      expect(mockReq.validatedFile.secureFilename).not.toContain('<');
      expect(mockReq.validatedFile.secureFilename).not.toContain('script');
    });
    
    it('should prevent PHP file upload with image extension', async () => {
      const phpContent = Buffer.from('<?php system($_GET["cmd"]); ?>');
      
      mockReq.isMultipart.mockReturnValue(true);
      mockReq.file = vi.fn().mockResolvedValue({
        filename: 'shell.jpg',
        mimetype: 'image/jpeg',
        file: createMockStream(phpContent)
      });
      
      await validateImageUpload(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: "invalid-image-signature"
        })
      );
    });
    
    it('should prevent zip bomb attempts', async () => {
      // Simulate large file by creating oversized content
      const hugeBuffer = Buffer.alloc(10 * 1024 * 1024, 0); // 10MB
      
      mockReq.isMultipart.mockReturnValue(true);
      mockReq.file = vi.fn().mockResolvedValue({
        filename: 'bomb.jpg',
        mimetype: 'image/jpeg',
        file: createMockStream(hugeBuffer)
      });
      
      await validateImageUpload(mockReq, mockReply);
      
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: "file-too-large"
        })
      );
    });
  });
});

// Test helper functions
function createMockStream(data) {
  const stream = new Readable({
    read() {
      this.push(data);
      this.push(null);
    }
  });
  return stream;
}

function createJpegHeader() {
  // Valid JPEG file signature: FF D8 FF
  return Buffer.concat([
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]),
    Buffer.from('JFIF'),
    Buffer.alloc(100, 0) // Some fake JPEG data
  ]);
}

function createPngHeader() {
  // Valid PNG file signature: 89 50 4E 47 0D 0A 1A 0A
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    Buffer.from('IHDR'),
    Buffer.alloc(100, 0) // Some fake PNG data
  ]);
}