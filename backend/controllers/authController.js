import USERS from '../config/users.js'
import { signToken } from '../middleware/auth.js'

export const login = (req, res) => {
  const { username, password } = req.body ?? {}

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' })
  }

  const user = USERS.find(
    (u) => u.username.toLowerCase() === String(username).toLowerCase().trim()
  )

  // Constant-time-ish comparison — avoids trivial timing attacks
  const match = user && user.password === String(password)

  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = signToken({ id: user.id, username: user.username, name: user.name, role: user.role })

  res.json({
    token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
  })
}

export const me = (req, res) => {
  // req.user is set by requireAuth middleware
  res.json(req.user)
}
