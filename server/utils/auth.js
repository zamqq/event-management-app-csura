import jwt from 'jsonwebtoken'
import { createCustomError } from './error'

// Get JWT secret from environment directly for server-side
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw createCustomError({
      statusCode: 401,
      statusMessage: 'Invalid or expired token'
    })
  }
}

export const setAuthCookie = (event, token) => {
  setCookie(event, 'auth-token', token, {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'strict'
  })
}

export const clearAuthCookie = (event) => {
  setCookie(event, 'auth-token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0
  })
}

export const getAuthToken = (event) => {
  // Try to get token from cookies first
  const cookieToken = getCookie(event, 'auth-token')
  if (cookieToken) return cookieToken
  
  // Then check authorization header
  const authHeader = getRequestHeader(event, 'authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1]
  }
  
  return null
}

export const requireAuth = (event) => {
  const token = getAuthToken(event)
  if (!token) {
    throw createCustomError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }
  
  try {
    const decoded = verifyToken(token)
    event.context.auth = decoded
    return decoded
  } catch (error) {
    throw createCustomError({
      statusCode: 401,
      statusMessage: 'Invalid or expired token'
    })
  }
} 