//path: src/controllers/image.controller.js
import * as ImageService from "#src/services/images.service.js";
import path from "path";
import fs from "fs";
import Config from "#config";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadImage = async (req, reply) => {
  // File validation is now handled by validateImageUpload middleware
  // Validated file data is available in req.validatedFile
  if (!req.validatedFile) {
    return reply.status(400).send({
      success: false,
      message: "File validation failed",
      errorKey: 702274,
      errorCode: "file-validation-failed",
    });
  }
  
  let filename;
  try {
    filename = await ImageService.saveSecureImage(req.validatedFile);
    if (filename?.success === false) {
      return reply.status(500).send({
        success: false,
        message: "Error saving image",
        errorKey: 517708,
        errorCode: "error-saving-image",
        fromError: Config.IN_PROD ? null : filename,
      });
    }
  } catch (error) {
    console.log('=== error === images.controller.js === key: 620523 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return reply.status(500).send({
      success: false,
      message: "Error saving image",
      errorKey: 914188,
      errorCode: "error-saving-image",
      fromError: Config.IN_PROD ? null : error.message,
    });
  }
  console.log('=== Config.IN_PROD === images.controller.js === key: 255568 ===');
  console.dir(Config.IN_PROD, { depth: null, colors: true })
  console.log('=================================');
  console.log('=== Config.IN_DEV === images.controller.js === key: 746411 ===');
  console.dir(Config.IN_DEV, { depth: null, colors: true })
  console.log('=================================');
  let imageUrl;
  if (Config.EXTERNAL_API_URL) {
    imageUrl = `${Config.EXTERNAL_API_URL}/api/${Config.API_VERSION}/images/${filename}`;
  } else {
    imageUrl = `${Config.IN_PROD?"https":"http"}://${req.hostname}${Config.IN_DEV?`:${Config.SERVER.PORT}`:""}/api/${Config.API_VERSION}/images/${filename}`;
  }
  const imageReply = {
    success: true,
    url: imageUrl,
    filename,
  };
  console.log('=== imageReply === images.controller.js === key: 082552 ===');
  console.dir(imageReply, { depth: null, colors: true })
  console.log('=================================');
  reply.send(imageReply);
};

export const loadImage = async (req, reply) => {
  // Filename is validated and sanitized by validateFileAccess middleware
  const filename = req.sanitizedFilename;
  
  if (!filename) {
    return reply.status(400).send({ 
      success: false, 
      message: "Invalid filename" 
    });
  }

  const imagePath = path.join(__dirname, "../../uploads", filename);

  if (fs.existsSync(imagePath)) {
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = "image/jpeg"; // default
    
    switch (ext) {
      case '.png':
        contentType = "image/png";
        break;
      case '.gif':
        contentType = "image/gif";
        break;
      case '.webp':
        contentType = "image/webp";
        break;
      case '.jpg':
      case '.jpeg':
        contentType = "image/jpeg";
        break;
    }
    
    reply.header("Content-Type", contentType);
    return reply.send(fs.createReadStream(imagePath));
  } else {
    return reply.status(404).send({ success: false, message: "Image not found" });
  }
};
