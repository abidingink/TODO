import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

export class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.loadSessions();
  }

  async loadSessions() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(SESSIONS_FILE, 'utf-8');
      const sessions = JSON.parse(data);
      this.sessions = new Map(Object.entries(sessions));
    } catch (error) {
      this.sessions = new Map();
    }
  }

  async saveSessions() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const sessions = Object.fromEntries(this.sessions);
      await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  }

  async createSession(userId) {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };
    
    this.sessions.set(sessionId, session);
    await this.saveSessions();
    
    return session;
  }

  async getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) return null;
    
    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      this.sessions.delete(sessionId);
      await this.saveSessions();
      return null;
    }
    
    return session;
  }

  async deleteSession(sessionId) {
    this.sessions.delete(sessionId);
    await this.saveSessions();
  }

  async cleanupExpiredSessions() {
    const now = new Date();
    let changed = false;
    
    for (const [id, session] of this.sessions) {
      if (new Date(session.expiresAt) < now) {
        this.sessions.delete(id);
        changed = true;
      }
    }
    
    if (changed) {
      await this.saveSessions();
    }
  }
}
