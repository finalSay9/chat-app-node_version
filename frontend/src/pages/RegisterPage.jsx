import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/axios'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/register', form)
      login(res.data.token, res.data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0e1621] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#2b5278] mb-4">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">ChatApp</h1>
          <p className="text-[#7d8fa3] mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#17212b] rounded-2xl p-8 shadow-xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-[#7d8fa3] text-sm mb-2">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              className="w-full bg-[#242f3d] text-white rounded-xl px-4 py-3 outline-none border border-transparent focus:border-[#2b5278] transition-colors placeholder-[#4a5568]"
              placeholder="yourname"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-[#7d8fa3] text-sm mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full bg-[#242f3d] text-white rounded-xl px-4 py-3 outline-none border border-transparent focus:border-[#2b5278] transition-colors placeholder-[#4a5568]"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-[#7d8fa3] text-sm mb-2">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full bg-[#242f3d] text-white rounded-xl px-4 py-3 outline-none border border-transparent focus:border-[#2b5278] transition-colors placeholder-[#4a5568]"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2b5278] hover:bg-[#3a6a9a] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-[#7d8fa3] text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#5b9bd5] hover:text-[#7ab3e8] transition-colors">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}