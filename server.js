import app from './src/app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

// In Vercel, app is imported as serverless function.
// For local or standard Node.js server, we start listening:
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  SIPAB Node.js Server running on http://localhost:${PORT}`);
    console.log(`  Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Database    : ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    console.log(`  Healthcheck : http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

export default app;
