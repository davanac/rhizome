// path: src/database/index.js
import pkg from 'pg';
import Config from '#config';

const { Pool } = pkg;

// Création du Pool en se basant sur tes variables de config
const pool = new Pool({
  host: Config.DB.HOST,
  port: Number(Config.DB.PORT),
  user: Config.DB.USER,
  password: Config.DB.PASSWORD,
  database: Config.DB.NAME,
});

// Gestion globale des erreurs éventuelles
pool.on('error', (err, client) => {
  console.error('❌ Erreur inattendue sur le client PostgreSQL', err);
  // Selon le cas, tu peux décider de stopper l’app :
  // process.exit(1);
});

/**
 * Initialise la connexion DB (ex : test un "SELECT 1").
 * Appelle cette fonction dans server.js (avant server.listen) pour valider la connexion.
 */
export async function initDB() {
  try {
    const resp = await pool.query('SELECT 1');
    console.log('✅ Connexion PostgreSQL établie avec succès');
    return resp;
  } catch (error) {
    console.log('=== error === database.js === key: 928672 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    console.error('❌ Erreur de connexion à la base PostgreSQL :', error);
    process.exit(1); // On arrête l'app si la DB est indispensable
  }
}

export default pool;
