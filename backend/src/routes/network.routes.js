//path: src/routes/network.routes.js

import * as NetworkController from '#controllers/network.controller.js';

export default async (app) => {
  //app.get('/', NetworkController.get);
  app.get('/', NetworkController.getNetwork);
};