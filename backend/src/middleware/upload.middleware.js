// path: /src/middleware/upload.middleware.js
import path from 'path';
import crypto from 'crypto';

// Security configuration
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILENAME_LENGTH = 100;

// Dangerous file signatures to detect disguised files
const DANGEROUS_SIGNATURES = [
  { signature: Buffer.from([0x4D, 0x5A]), type: 'Windows Executable' }, // MZ (PE/EXE)
  { signature: Buffer.from([0x7F, 0x45, 0x4C, 0x46]), type: 'Linux Executable' }, // ELF
  { signature: Buffer.from([0x3C, 0x3F, 0x70, 0x68, 0x70]), type: 'PHP Script' }, // <?php
  { signature: Buffer.from([0x3C, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74]), type: 'HTML Script' }, // <script
  { signature: Buffer.from([0x50, 0x4B, 0x03, 0x04]), type: 'ZIP Archive' }, // ZIP
  { signature: Buffer.from([0x52, 0x61, 0x72, 0x21]), type: 'RAR Archive' }, // RAR
];

/**
 * Validates file content by reading file signatures/magic bytes
 * Prevents uploaded files from being disguised malicious content
 */
async function validateFileSignature(fileStream, filename) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalSize = 0;
    
    fileStream.on('data', (chunk) => {
      chunks.push(chunk);
      totalSize += chunk.length;
      
      // Read first 512 bytes for signature analysis
      if (totalSize >= 512) {
        fileStream.destroy(); // Stop reading
      }
    });
    
    fileStream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      
      // Check for dangerous file signatures
      for (const danger of DANGEROUS_SIGNATURES) {
        if (buffer.indexOf(danger.signature) === 0) {
          return reject(new Error(`Dangerous file detected: ${danger.type}`));
        }
      }
      
      // Validate image signatures
      const isValidImage = validateImageSignature(buffer);
      if (!isValidImage) {
        return reject(new Error('Invalid image file signature'));
      }
      
      resolve(buffer);
    });
    
    fileStream.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Validates image file signatures to ensure files are actually images
 */
function validateImageSignature(buffer) {
  if (buffer.length < 4) return false;
  
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return true;
  }
  
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) {
    return true;
  }
  
  // GIF87a or GIF89a: 47 49 46 38 37 61 or 47 49 46 38 39 61
  if (buffer.subarray(0, 6).equals(Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61])) ||
      buffer.subarray(0, 6).equals(Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))) {
    return true;
  }
  
  // WebP: RIFF....WEBP
  if (buffer.subarray(0, 4).equals(Buffer.from([0x52, 0x49, 0x46, 0x46])) &&
      buffer.subarray(8, 12).equals(Buffer.from([0x57, 0x45, 0x42, 0x50]))) {
    return true;
  }
  
  return false;
}

/**
 * Sanitizes filename to prevent path traversal and other attacks
 */
function sanitizeFilename(originalFilename) {
  if (!originalFilename || typeof originalFilename !== 'string') {
    throw new Error('Invalid filename provided');
  }
  
  // Remove path traversal attempts
  let sanitized = originalFilename.replace(/\.\./g, '');
  
  // Remove directory separators
  sanitized = sanitized.replace(/[\/\\]/g, '');
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1f\x80-\x9f]/g, '');
  
  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');
  
  // Limit length
  if (sanitized.length > MAX_FILENAME_LENGTH) {
    const ext = path.extname(sanitized);
    const name = sanitized.substring(0, MAX_FILENAME_LENGTH - ext.length);
    sanitized = name + ext;
  }
  
  // Ensure it's not empty
  if (sanitized.length === 0) {
    sanitized = 'upload';
  }
  
  return sanitized;
}

/**
 * Generates secure filename with timestamp and random component
 */
function generateSecureFilename(originalFilename) {
  const sanitized = sanitizeFilename(originalFilename);
  const ext = path.extname(sanitized).toLowerCase();
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  
  return `${timestamp}-${randomBytes}${ext}`;
}

/**
 * Main upload validation middleware
 * Validates file type, size, content, and sanitizes filename
 */
export async function validateImageUpload(req, reply) {
  try {
    // Check if request is multipart
    if (!req.isMultipart()) {
      return reply.status(400).send({
        success: false,
        message: "Content-Type must be multipart/form-data",
        errorCode: "invalid-content-type",
        errorKey: 400401
      });
    }
    
    const data = await req.file();
    
    if (!data) {
      return reply.status(400).send({
        success: false,
        message: "No file uploaded",
        errorCode: "no-file-uploaded",
        errorKey: 400402
      });
    }
    
    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(data.mimetype)) {
      return reply.status(400).send({
        success: false,
        message: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
        errorCode: "invalid-file-type",
        errorKey: 400403
      });
    }
    
    // Validate file extension
    const ext = path.extname(data.filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return reply.status(400).send({
        success: false,
        message: `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
        errorCode: "invalid-file-extension", 
        errorKey: 400404
      });
    }
    
    // Validate filename length and characters
    if (!data.filename || data.filename.length > MAX_FILENAME_LENGTH) {
      return reply.status(400).send({
        success: false,
        message: `Filename too long. Maximum ${MAX_FILENAME_LENGTH} characters`,
        errorCode: "filename-too-long",
        errorKey: 400405
      });
    }
    
    // Check file size by reading the stream
    let fileSize = 0;
    const chunks = [];
    
    for await (const chunk of data.file) {
      fileSize += chunk.length;
      
      if (fileSize > MAX_FILE_SIZE) {
        return reply.status(400).send({
          success: false,
          message: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          errorCode: "file-too-large",
          errorKey: 400406
        });
      }
      
      chunks.push(chunk);
    }
    
    // Reconstruct buffer from chunks for signature validation
    const fileBuffer = Buffer.concat(chunks);
    
    // Validate file signature
    try {
      const isValidImage = validateImageSignature(fileBuffer);
      if (!isValidImage) {
        return reply.status(400).send({
          success: false,
          message: "Invalid image file. File signature does not match image format",
          errorCode: "invalid-image-signature",
          errorKey: 400407
        });
      }
    } catch (signatureError) {
      return reply.status(400).send({
        success: false,
        message: "Potentially dangerous file detected",
        errorCode: "dangerous-file-detected",
        errorKey: 400408
      });
    }
    
    // Generate secure filename
    const secureFilename = generateSecureFilename(data.filename);
    
    // Add validated data to request for controller to use
    req.validatedFile = {
      buffer: fileBuffer,
      originalFilename: data.filename,
      secureFilename: secureFilename,
      mimetype: data.mimetype,
      size: fileSize
    };
    
  } catch (error) {
    console.log('=== error === upload.middleware.js === validateImageUpload === key: 500401 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');
    
    return reply.status(500).send({
      success: false,
      message: 'Internal server error during file validation',
      errorCode: "file-validation-error",
      errorKey: 500401
    });
  }
}

/**
 * Validates filename for file retrieval to prevent directory traversal
 */
export async function validateFileAccess(req, reply) {
  try {
    const { filename } = req.params;
    
    if (!filename || typeof filename !== 'string') {
      return reply.status(400).send({
        success: false,
        message: 'Invalid filename parameter',
        errorCode: 'invalid-filename-parameter',
        errorKey: 400409
      });
    }
    
    // Check for directory traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return reply.status(403).send({
        success: false,
        message: 'Access denied - Invalid filename',
        errorCode: 'directory-traversal-attempt',
        errorKey: 403401
      });
    }
    
    // Validate filename format (should be: timestamp-randomhex.ext)
    // Timestamp: 10+ digits, Random hex: 8+ chars, Extension: allowed image types  
    const filenamePattern = /^[0-9]{10,}-[a-f0-9]{8,}\.(jpg|jpeg|png|webp|gif)$/i;
    if (!filenamePattern.test(filename)) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid filename format',
        errorCode: 'invalid-filename-format',
        errorKey: 400410
      });
    }
    
    // Add sanitized filename to request
    req.sanitizedFilename = filename;
    
    // No explicit return needed - Fastify will continue to the route handler
    
  } catch (error) {
    console.log('=== error === upload.middleware.js === validateFileAccess === key: 500402 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');
    
    return reply.status(500).send({
      success: false,
      message: 'Internal server error during file access validation',
      errorCode: "file-access-validation-error", 
      errorKey: 500402
    });
  }
}