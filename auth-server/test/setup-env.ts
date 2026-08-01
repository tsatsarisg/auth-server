// Loaded via jest setupFiles BEFORE any module import, so src/config/env.ts
// (which validates process.env at module scope) sees a complete environment.
process.env.PORT = process.env.PORT ?? '3000';
process.env.DB_PROVIDER = 'postgres';
process.env.POSTGRES_URI = 'postgres://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-access-secret-0123456789abcdef0123456789abcdef';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-0123456789abcdef0123456789abcdef';
process.env.ENCRYPTION_KEY_BASE64 = Buffer.alloc(32, 7).toString('base64');
