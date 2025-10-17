import * as BlockchainController from "#controllers/blockchain.controller.js";

import { authenticateUser, extractUserId } from "#middleware/auth.middleware.js";

export default async (app) => {
  app.get(
    "/:nft_contract/:token_id",
    {
      preHandler: extractUserId,
      config: {
        protected: false,
      },
    },
    BlockchainController.getNFT
  );
};
