import fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import routes from "#src/routes/routes.js";
import Config from "#config";
import { initDB } from "#database/database.js";
import { authenticateUser } from "#middleware/auth.middleware.js";
import CustomLogger from "#src/logger/customLogHandler.js";
import { runMigrationsOnStartup } from "#database/migrate.js";

// Initialisation du logger
CustomLogger.init({ output: CustomLogger.CONSOLE });

// Création du serveur Fastify avec limite de taille de corps de requête à 100 Mo
const server = fastify({
  bodyLimit: 100 * 1024 * 1024 // 100 Mo
});

// Enregistrement du plugin multipart avec limites de taille
server.register(multipart, {
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 Mo max par fichier
    files: 1                     // un seul fichier par requête
  }
});

// CORS
server.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["*"],
  credentials: true,
});

// Routes
server.register(routes);

// Hooks de log en développement
if (Config.IN_DEV || Config.IN_REMOTE_DEV) {
  server.addHook("onRequest", async (request, reply) => {
    const now = new Date().toISOString();
    const requestLog = {
      title: `[--- [REQUEST RECEIVED] --- ${now} ---]`,
      date: now,
      Method: request.method,
      URL: request.url,
      isProtected: reply.routeOptions?.config?.protected || false,
      footer: `[--- [END OF REQUEST] --- ${now} ---]`,
    };
    request.body && (requestLog.Body = request.body);
    request.query && (requestLog.Query = request.query);
    // console.dir(requestLog, { depth: null, colors: true });
  });

  server.addHook("preHandler", async (request, reply) => {
    const now = new Date().toISOString();
    const requestLog = {
      title: `[--- [PRE-HANDLER] --- ${now} ---]`,
      date: now,
      Method: request.method,
      URL: request.url,
      isProtected: reply.routeOptions?.config?.protected || false,
      footer: `[--- [END OF PRE-HANDLER] --- ${now} ---]`,
    };
    request.body && (requestLog.Body = request.body);
    request.query && (requestLog.Query = request.query);
    // console.dir(requestLog, { depth: null, colors: true });
  });
}

// Hook de log sur envoi de réponse
server.addHook("onSend", async (request, reply, payload) => {
  const now = new Date().toISOString();
  const requestLog = {
    title: `[--- [REQUEST COMPLETED] --- ${now} ---]`,
    date: now,
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    isProtected: reply.routeOptions?.config?.protected || false,
    footer: `[--- [END OF RESPONSE] --- ${now} ---]`,
  };
  request.body && (requestLog.body = request.body);
  request.query && (requestLog.query = request.query);
  try {
    requestLog.response = JSON.parse(payload);
  } catch {
    requestLog.response = payload;
  }
  // console.dir(requestLog, { depth: null, colors: true });
});

// Routes publiques
server.get(
  `/api/${Config.API_VERSION}`,
  async () => {
    return { data: "Hello World!" };
  }
);

// Routes protégées
const protectedOpts = {
  preHandler: authenticateUser,
  config: { protected: true }
};

["get", "post", "put", "patch", "delete"].forEach((method) => {
  server[method](
    `/*`,
    protectedOpts,
    async () => {
      return { data: "Hello World!" };
    }
  );
});

// Démarrage du serveur
const start = async () => {
  try {
    // Run database migrations on startup (production only)
    await runMigrationsOnStartup();

    const port = Number(Config.SERVER.PORT) || 3009;
    const host = '0.0.0.0';
    await server.listen({ port, host });
    console.log(`Server listening at http://${host}:${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
