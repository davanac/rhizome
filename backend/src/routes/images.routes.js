//path : src/routes/image.routes.js
import { uploadImage, loadImage } from "#src/controllers/images.controller.js";
import { authenticateUser } from "#middleware/auth.middleware.js";
import { validateImageUpload, validateFileAccess } from "#middleware/upload.middleware.js";

export default async (app) => {
  app.post(
    "/upload",
    {
      preHandler: [authenticateUser, validateImageUpload],
      config: {
        protected: true,
      },
    },
    uploadImage
  );

  app.get("/:filename", {
    preHandler: validateFileAccess,
    config: {
      protected: false,
    },
  }, loadImage);
};
