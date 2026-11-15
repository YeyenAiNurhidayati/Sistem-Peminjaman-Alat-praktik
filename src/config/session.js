import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import pool from './database.js';
import dotenv from 'dotenv';

dotenv.config();

const MySQLStore = MySQLStoreFactory(session);

const sessionStore = new MySQLStore({
  createDatabaseTable: true,
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 mins
  expiration: 86400000, // 1 day
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
}, pool);

export const sessionMiddleware = session({
  key: 'sipab_session',
  secret: process.env.SESSION_SECRET || 'sipab_fallback_secret_key_2026',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
});

export default sessionMiddleware;
