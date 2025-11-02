# Authentication Guide

## Overview

The Muzik Server API uses **JWT (JSON Web Tokens)** for authentication and authorization.

## Setup

1. **Install dependencies** (already done):
```bash
npm install jsonwebtoken
```

2. **Configure environment variables** in `.env`:
```env
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

## Authentication Flow

### 1. Register New User

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "John Doe",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Access Protected Resources

Include the JWT token in the `Authorization` header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example:**
```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Token Structure

The JWT token contains:
- `userId` - User ID
- `email` - User email
- `username` - User username
- `exp` - Expiration time

## Middleware Usage

### Protecting Routes

To protect a route, import and use the `authenticateToken` middleware:

```javascript
import express from 'express'
import { authenticateToken } from '../middleware/authMiddleware.js'
import { yourController } from '../controllers/yourController.js'

const router = express.Router()

// This route requires authentication
router.get('/protected', authenticateToken, yourController)

export default router
```

### Accessing User Info

In protected routes, user information is available in `req`:

```javascript
export const protectedController = async (req, res) => {
  const userId = req.userId      // From JWT token
  const user = req.user           // Full user object from JWT
  
  // Your controller logic here
  res.json({ message: `Hello, user ${userId}!` })
}
```

## Error Responses

### Missing Token
```json
{
  "error": "Access token required"
}
```
**Status:** 401

### Invalid/Expired Token
```json
{
  "error": "Invalid or expired token"
}
```
**Status:** 403

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","username":"Test User"}'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Get Profile
```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Security Best Practices

1. **Change JWT_SECRET** in production
2. **Use HTTPS** in production
3. **Keep token expiration short** (default is 7 days, consider 1-24 hours for production)
4. **Store tokens securely** on client side (not in localStorage if possible)
5. **Consider refresh tokens** for long-lived sessions

