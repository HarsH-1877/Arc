import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Use DATABASE_URL if available (Render), otherwise use individual vars (local)
const pool = new Pool(
    process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'arc_db',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD,
        }
);

pool.on('error', (err: Error) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(-1);
});

export default pool;
