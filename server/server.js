const app = require('./src/app');
const connectDB = require('./src/config/db');
const env = require('./src/config/env');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const start = async () => {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║           Quzify API Server               ║
║                                           ║
║   Port:        ${env.PORT}                     ║
║   Environment: ${env.NODE_ENV.padEnd(24)}║
║   MongoDB:     Connected                  ║
╚═══════════════════════════════════════════╝
    `);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
