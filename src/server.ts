import dotenv from 'dotenv';
import { app } from './app.js';
import { prisma } from './db/prisma.db.js';

dotenv.config();

const PORT = process.env.PORT || 8000;

// Database Connection Check
async function startServer() {
  try {
    // Attempt to query the DB to ensure connection is alive
    await prisma.$connect();
    console.log("✅ PostgreSQL Connected via Prisma!");

    app.listen(PORT, () => {
      console.log(`⚙️  Server is running at port : ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Database connection FAILED", error);
    process.exit(1);
  }
}

startServer();