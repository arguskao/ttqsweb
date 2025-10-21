// Session management for enhanced security
import jwt from 'jsonwebtoken'
import { AuthenticationError } from './errors'

interface SessionData {
  userId: number
  email: string
  userType: string
  sessionId: string
  createdAt: number
  lastActivity: number
  ipAddress: string
  userAgent: string
}

interface TokenBlacklist {
  [tokenId: string]: {
    blacklistedAt: number
    expiresAt: number
  }
}

// In-memory session store (in production, use Redis)
const activeSessions = new Map<string, SessionData>()
const tokenBlacklist: TokenBlacklist = {}

// Clean up expired sessions and blacklisted tokens
setInterval(
  () => {
    const now = Date.now()

    // Clean up expired sessions (24 hours)
    for (const [sessionId, session] of activeSessions.entries()) {
      if (now - session.lastActivity > 24 * 60 * 60 * 1000) {
        activeSessions.delete(sessionId)
      }
    }

    // Clean up expired blacklisted tokens
    for (const [tokenId, blacklistEntry] of Object.entries(tokenBlacklist)) {
      if (now > blacklistEntry.expiresAt) {
        delete tokenBlacklist[tokenId]
      }
    }
  },
  5 * 60 * 1000
) // Clean up every 5 minutes

export class SessionManager {
  // Create a new session
  static createSession(
    userId: number,
    email: string,
    userType: string,
    ipAddress: string,
    userAgent: string
  ): string {
    const sessionId = this.generateSessionId()
    const now = Date.now()

    const session: SessionData = {
      userId,
      email,
      userType,
      sessionId,
      createdAt: now,
      lastActivity: now,
      ipAddress,
      userAgent
    }

    activeSessions.set(sessionId, session)
    return sessionId
  }

  // Update session activity
  static updateSessionActivity(sessionId: string): boolean {
    const session = activeSessions.get(sessionId)
    if (!session) {
      return false
    }

    session.lastActivity = Date.now()
    return true
  }

  // Get session data
  static getSession(sessionId: string): SessionData | null {
    const session = activeSessions.get(sessionId)
    if (!session) {
      return null
    }

    // Update last activity
    session.lastActivity = Date.now()
    return session
  }

  // Invalidate session
  static invalidateSession(sessionId: string): boolean {
    return activeSessions.delete(sessionId)
  }

  // Invalidate all sessions for a user
  static invalidateUserSessions(userId: number): number {
    let count = 0
    for (const [sessionId, session] of activeSessions.entries()) {
      if (session.userId === userId) {
        activeSessions.delete(sessionId)
        count++
      }
    }
    return count
  }

  // Blacklist a token
  static blacklistToken(tokenId: string, expiresAt: number): void {
    tokenBlacklist[tokenId] = {
      blacklistedAt: Date.now(),
      expiresAt
    }
  }

  // Check if token is blacklisted
  static isTokenBlacklisted(tokenId: string): boolean {
    const blacklistEntry = tokenBlacklist[tokenId]
    if (!blacklistEntry) {
      return false
    }

    // Remove expired blacklist entry
    if (Date.now() > blacklistEntry.expiresAt) {
      delete tokenBlacklist[tokenId]
      return false
    }

    return true
  }

  // Generate secure session ID
  private static generateSessionId(): string {
    const crypto = require('crypto')
    return crypto.randomBytes(32).toString('hex')
  }

  // Get active sessions for a user
  static getUserSessions(userId: number): SessionData[] {
    const sessions: SessionData[] = []
    for (const session of activeSessions.values()) {
      if (session.userId === userId) {
        sessions.push(session)
      }
    }
    return sessions
  }
}

// Enhanced JWT token with session management
export const generateSecureToken = (payload: any, sessionId: string): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }

  const tokenPayload = {
    ...payload,
    sessionId,
    tokenId: require('crypto').randomBytes(16).toString('hex'),
    iat: Math.floor(Date.now() / 1000)
  }

  return jwt.sign(tokenPayload, secret, {
    expiresIn: '24h',
    issuer: 'pharmacy-assistant-academy',
    audience: 'pharmacy-assistant-academy-users'
  })
}

// Verify token with session validation
export const verifySecureToken = (token: string): any => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }

  const payload = jwt.verify(token, secret, {
    issuer: 'pharmacy-assistant-academy',
    audience: 'pharmacy-assistant-academy-users'
  }) as any

  // Check if token is blacklisted
  if (SessionManager.isTokenBlacklisted(payload.tokenId)) {
    throw new AuthenticationError('Token has been revoked')
  }

  // Validate session
  const session = SessionManager.getSession(payload.sessionId)
  if (!session) {
    throw new AuthenticationError('Session not found or expired')
  }

  return payload
}
