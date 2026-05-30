import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Ensure required env vars are set for tests
process.env['MONGODB_URI'] = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/facturacion-test';
process.env['JWT_ACCESS_SECRET'] = process.env['JWT_ACCESS_SECRET'] ?? 'test_access_secret_32_chars_long!!';
process.env['JWT_REFRESH_SECRET'] = process.env['JWT_REFRESH_SECRET'] ?? 'test_refresh_secret_32_chars_long!';
process.env['REDIS_URL'] = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
process.env['NODE_ENV'] = 'test';
