import 'dotenv/config';
import { buildApp } from './app.js';
import { env } from './config/env.js';

async function main() {
  try {
    const app = await buildApp();

    await app.listen({
      host: env.HOST,
      port: env.PORT,
    });

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║    🚀 QUESTIONNAIRE INTEROPÉRABILITÉ SENUM                   ║
╠══════════════════════════════════════════════════════════════╣
║    Server:  http://${env.HOST}:${env.PORT}                           ║
║    Docs:    http://${env.HOST}:${env.PORT}/documentation             ║
║    Health:  http://${env.HOST}:${env.PORT}/health                    ║
║    Mode:    ${env.NODE_ENV.padEnd(51)}║
╚══════════════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

main();
