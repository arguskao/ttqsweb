import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import { ValidationError, AuthenticationError, ConflictError } from '../types/errors'
import { getDatabasePool } from '../config/database'

// User types
export type UserType = 'admin' | 'instructor' | 'employer' | 'job_seeker'

// Registration data interface
export interface RegisterData {
  email: string
  password: string
  userType: UserType
  firstName: string
  lastName: string
  phone?: string
}

// Login data interface
export interface LoginData {
  email: string
  password: string
}

// User data interface (without password)
export interface User {
  id: number
  email: string
  userType: UserType
  firstName: string
  lastName: string
  phone?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

// JWT payload interface
export interface JwtPayload {
  userId: number
  email: string
  userType: UserType
}

// Secure password hashing using bcrypt
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12 // High security salt rounds
  return await bcrypt.hash(password, saltRounds)
}

// Verify password using bcrypt
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash)
}

// Generate JWT token with secure configuration
const generateToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }

  return jwt.sign(payload, secret, {
    expiresIn: '24h', // Shorter expiration time for better security
    issuer: 'pharmacy-assistant-academy',
    audience: 'pharmacy-assistant-academy-users'
  })
}

// Verify JWT token with secure configuration
export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }

  return jwt.verify(token, secret, {
    issuer: 'pharmacy-assistant-academy',
    audience: 'pharmacy-assistant-academy-users'
  }) as JwtPayload
}

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Enhanced password strength validation
const isValidPassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: '密碼必須至少8個字符' }
  }

  if (password.length > 128) {
    return { isValid: false, message: '密碼不能超過128個字符' }
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: '密碼必須包含至少一個小寫字母' }
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: '密碼必須包含至少一個大寫字母' }
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: '密碼必須包含至少一個數字' }
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, message: '密碼必須包含至少一個特殊字符' }
  }

  // Check for common weak passwords
  const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123']
  if (commonPasswords.includes(password.toLowerCase())) {
    return { isValid: false, message: '密碼過於常見，請選擇更安全的密碼' }
  }

  return { isValid: true }
}

// Register new user
export const registerUser = async (data: RegisterData): Promise<{ user: User; token: string }> => {
  const { email, password, userType, firstName, lastName, phone } = data

  // Validate input data
  if (!email || !password || !userType || !firstName || !lastName) {
    throw new ValidationError('所有必填欄位都必須提供')
  }

  if (!isValidEmail(email)) {
    throw new ValidationError('電子郵件格式不正確')
  }

  const passwordValidation = isValidPassword(password)
  if (!passwordValidation.isValid) {
    throw new ValidationError(passwordValidation.message!)
  }

  if (!['admin', 'instructor', 'employer', 'job_seeker'].includes(userType)) {
    throw new ValidationError('用戶類型必須是管理員、講師、雇主或求職者')
  }

  const pool = getDatabasePool()
  const client = await pool.connect()

  try {
    // Check if user already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email])

    if (existingUser.rows.length > 0) {
      throw new ConflictError('此電子郵件已被註冊')
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Insert new user
    const result = await client.query(
      `INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, email, user_type, first_name, last_name, phone, created_at, updated_at, is_active`,
      [email, passwordHash, userType, firstName, lastName, phone]
    )

    const userRow = result.rows[0]
    const user: User = {
      id: userRow.id,
      email: userRow.email,
      userType: userRow.user_type,
      firstName: userRow.first_name,
      lastName: userRow.last_name,
      phone: userRow.phone,
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at,
      isActive: userRow.is_active
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      userType: user.userType
    })

    return { user, token }
  } finally {
    client.release()
  }
}

// Login user
export const loginUser = async (data: LoginData): Promise<{ user: User; token: string }> => {
  const { email, password } = data

  // Validate input data
  if (!email || !password) {
    throw new ValidationError('電子郵件和密碼都必須提供')
  }

  if (!isValidEmail(email)) {
    throw new ValidationError('電子郵件格式不正確')
  }

  const pool = getDatabasePool()
  const client = await pool.connect()

  try {
    // Find user by email
    const result = await client.query(
      `SELECT id, email, password_hash, user_type, first_name, last_name, phone, 
                    created_at, updated_at, is_active
             FROM users 
             WHERE email = $1 AND is_active = true`,
      [email]
    )

    if (result.rows.length === 0) {
      throw new AuthenticationError('電子郵件或密碼錯誤')
    }

    const userRow = result.rows[0]

    // Verify password
    const isPasswordValid = await verifyPassword(password, userRow.password_hash)
    if (!isPasswordValid) {
      throw new AuthenticationError('電子郵件或密碼錯誤')
    }

    const user: User = {
      id: userRow.id,
      email: userRow.email,
      userType: userRow.user_type,
      firstName: userRow.first_name,
      lastName: userRow.last_name,
      phone: userRow.phone,
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at,
      isActive: userRow.is_active
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      userType: user.userType
    })

    return { user, token }
  } finally {
    client.release()
  }
}

// Get user by ID
export const getUserById = async (userId: number): Promise<User | null> => {
  const pool = getDatabasePool()
  const client = await pool.connect()

  try {
    const result = await client.query(
      `SELECT id, email, user_type, first_name, last_name, phone, 
                    created_at, updated_at, is_active
             FROM users 
             WHERE id = $1 AND is_active = true`,
      [userId]
    )

    if (result.rows.length === 0) {
      return null
    }

    const userRow = result.rows[0]
    return {
      id: userRow.id,
      email: userRow.email,
      userType: userRow.user_type,
      firstName: userRow.first_name,
      lastName: userRow.last_name,
      phone: userRow.phone,
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at,
      isActive: userRow.is_active
    }
  } finally {
    client.release()
  }
}
