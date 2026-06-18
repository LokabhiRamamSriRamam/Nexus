/**
 * CRM Users Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 * Edit this file to add, remove, or change users and passwords.
 * Passwords here are stored in plain text for easy management.
 * They are NEVER stored or logged anywhere — only compared server-side.
 * All communication is encrypted in transit (HTTPS) and sessions use signed JWTs.
 *
 * Fields:
 *   id       – unique identifier (any string, never change once set)
 *   username – login name (case-insensitive)
 *   password – plain text password (change freely here)
 *   name     – display name shown in the app
 *   role     – 'admin' | 'sales' (reserved for future role-based access)
 */

const USERS = [
  {
    id:       'user-1',
    username: 'avtanshg919@gmail.com',
    password: 'JaiSriGanesha/99',
  name:     'Avtansh Giri',
    role:     'admin',
  },
  {
    id:       'user-2',
    username: 'yashit.foruppo@gmail.com',
    password: 'JaiSriGanesha/99',
    name:     'Yashit Gupta',
    role:     'sales',
  },
]

export default USERS
