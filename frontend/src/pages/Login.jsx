import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function Login() {
  const login = useAuthStore((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show,     setShow]     = useState(false)
  const [loading,  setLoading]  = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password) return
    setLoading(true)
    try {
      await login(username.trim(), password)
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Nexus logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-5">
            {/* Glow halo */}
            <div className="absolute inset-0 rounded-full blur-2xl opacity-20 bg-accent scale-150 pointer-events-none" />
            <img
              src="/Nexus.png"
              alt="Nexus CRM"
              className="relative h-28 w-auto object-contain drop-shadow-[0_0_24px_rgba(232,255,71,0.18)]"
              draggable={false}
            />
          </div>
          <p className="text-[#444] text-[11px] tracking-[0.2em] uppercase">Sign in to continue</p>
        </div>

        {/* Card */}
        <form
          onSubmit={submit}
          className="bg-[#111] border border-[#222] rounded-2xl p-6 space-y-4 shadow-2xl"
        >
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[#666] text-[11px] uppercase tracking-wider font-medium">
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-[#f0f0f0] placeholder:text-[#444] focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-all"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[#666] text-[11px] uppercase tracking-wider font-medium">
              Password
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 pr-11 text-sm text-[#f0f0f0] placeholder:text-[#444] focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#aaa] transition-colors"
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="w-full bg-accent text-background font-bold text-sm rounded-lg py-3 mt-2 flex items-center justify-center gap-2 hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-[#333] text-[11px] mt-6">
          Nexus CRM · Internal use only
        </p>
      </motion.div>
    </div>
  )
}
