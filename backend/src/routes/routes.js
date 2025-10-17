//path: /src/routes/routes.js

import authRoutes from '#src/routes/auth.routes.js';
import profilesRoutes from '#src/routes/profiles.routes.js';
import projectsRoutes from '#src/routes/projects.routes.js'; 
import networkRoutes from '#routes/network.routes.js';
import imagesRoutes from '#src/routes/images.routes.js';
import blockchainRoutes from '#src/routes/blockchain.routes.js';
import NFTRoutes from '#src/routes/nft.routes.js';
import adminRoutes from '#src/routes/admin.routes.js';
//
import Config from '#config';
/** ------------------ cmt 449977 ------------------ 
import projectsRoutes from './projects/projects.routes'
*-------------------------------------------------*/

export default async (app) => {
  await app.register(authRoutes, { prefix: `/api/${Config.API_VERSION}/auth` });
  await app.register(profilesRoutes, { prefix: `/api/${Config.API_VERSION}/profiles` });
  await app.register(projectsRoutes, { prefix: `/api/${Config.API_VERSION}/projects` }); 
  await app.register(networkRoutes, { prefix: `/api/${Config.API_VERSION}/network` }); 
  await app.register(imagesRoutes, { prefix: `/api/${Config.API_VERSION}/images` });
  await app.register(blockchainRoutes, { prefix: `/api/${Config.API_VERSION}/blockchain` });
  await app.register(NFTRoutes, { prefix: `/api/${Config.API_VERSION}/nft` });
  await app.register(adminRoutes, { prefix: `/api/${Config.API_VERSION}/admin` });
};
