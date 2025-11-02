import { executeQueryOne, executeUpdate } from '../utils/helpers.js'
import { dbType } from '../config/database.js'
import crypto from 'crypto'
import { generateToken } from '../utils/jwt.js'

// Simple password hashing (in production, use bcrypt)
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export const register = async (req, res) => {
  const { email, password, username } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  try {
    const passwordHash = hashPassword(password)
    
    if (dbType === 'postgresql') {
      const query = `INSERT INTO users (email, password_hash, username)
         VALUES ($1, $2, $3)
         RETURNING id, email, username, created_at`
      const { db } = await import('../config/database.js')
      const result = await db.query(query, [email, passwordHash, username || null])
      
      const user = result.rows[0]
      const token = generateToken(user)
      
      res.status(201).json({
        message: 'User registered successfully',
        user,
        token,
      })
    } else {
      const query = `INSERT INTO users (email, password_hash, username)
         VALUES (?, ?, ?)`
      const result = await executeUpdate(query, [email, passwordHash, username || null])
      const user = await executeQueryOne('SELECT id, email, username, created_at FROM users WHERE id = ?', [result.insertId])
      const token = generateToken(user)
      
      res.status(201).json({
        message: 'User registered successfully',
        user,
        token,
      })
    }
  } catch (error) {
    if (error.code === '23505' || error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Email already exists' })
    } else {
      res.status(500).json({ error: error.message })
    }
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  try {
    const passwordHash = hashPassword(password)
    const query = dbType === 'postgresql'
      ? 'SELECT id, email, username FROM users WHERE email = $1 AND password_hash = $2'
      : 'SELECT id, email, username FROM users WHERE email = ? AND password_hash = ?'

    const user = await executeQueryOne(query, [email, passwordHash])

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const token = generateToken(user)

    res.json({
      message: 'Login successful',
      user,
      token,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getProfile = async (req, res) => {
  const userId = req.userId || req.params?.id

  if (!userId) {
    res.status(400).json({ error: 'User ID is required' })
    return
  }

  try {
    const query = dbType === 'postgresql'
      ? 'SELECT id, email, username, created_at FROM users WHERE id = $1'
      : 'SELECT id, email, username, created_at FROM users WHERE id = ?'

    const user = await executeQueryOne(query, [userId])

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

