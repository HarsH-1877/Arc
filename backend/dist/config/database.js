"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Use DATABASE_URL if available (Render), otherwise use individual vars (local)
const pool = new pg_1.Pool(process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // Required for Render PostgreSQL
        }
    }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'arc_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
    });
pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(-1);
});
exports.default = pool;
