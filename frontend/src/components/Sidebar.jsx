import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/axios'

export default function Sidebar({ conversations, activeId, onSelect, onNewConvo, socket }) {
  const { user, logout } = useAuth()
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  async function handleSearch(e) {
    const val = e.target.value
    setSearch(val)
    if (!val.trim()) { setSearchResults([]); return }

    try {
      const res = await api.get('/chat/users')
      setSearchResults(
        res.data.filter(u => u.username.toLowerCase().includes(val.toLowerCase()))
      )
    } catch (err) {
      console.error(err)
    }
  }

  async function startConversation(recipientId) {
    try {
      const res = await api.post('/chat/conversations', { recipientId })
      onNewConvo(res.data.conversationId)
      setSearch('')
      setSearchResults([])
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = conversations.filter(c =>
    c.other_username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-full md:w-80 bg-[#17212b] flex flex-col h-full flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#0d1824]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#2b5278] flex items-center justify-center text-white font-semibold text-sm">
            {user?.username[0].toUpperCase()}
          </div>
          <span className="text-white font-semibold">{user?.username}</span>
        </div>
        <button
          onClick={logout}
          title="Logout"
          className="text-[#7d8fa3] hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7d8fa3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search users or chats..."
            className="w-full bg-[#242f3d] text-white rounded-xl pl-10 pr-4 py-2 text-sm outline-none placeholder-[#7d8fa3]"
          />
        </div>
      </div>

      {/* User search results */}
      {searchResults.length > 0 && (
        <div className="px-4 mb-2">
          <p className="text-[#7d8fa3] text-xs mb-2 uppercase tracking-wide">Users</p>
          {searchResults.map(u => (
            <button
              key={u.id}
              onClick={() => startConversation(u.id)}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#242f3d] transition-colors"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#2b5278] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {u.username[0].toUpperCase()}
                </div>
                {u.is_online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#17212b]"/>}
              </div>
              <span className="text-white text-sm">{u.username}</span>
            </button>
          ))}
        </div>
      )}

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && !search && (
          <p className="text-center text-[#7d8fa3] text-sm mt-8 px-4">
            Search for a user above to start a conversation
          </p>
        )}
        {filtered.map(convo => (
          <button
            key={convo.id}
            onClick={() => onSelect(convo)}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#242f3d] transition-colors ${activeId === convo.id ? 'bg-[#2b5278]/30' : ''}`}
          >
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-[#2b5278] flex items-center justify-center text-white font-semibold">
                {convo.other_username[0].toUpperCase()}
              </div>
              {convo.is_online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#17212b]"/>}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex justify-between items-baseline">
                <p className="text-white font-medium text-sm truncate">{convo.other_username}</p>
                {convo.last_message_at && (
                  <span className="text-[10px] text-[#7d8fa3] flex-shrink-0 ml-2">
                    {new Date(convo.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <p className="text-[#7d8fa3] text-xs truncate mt-0.5">
                {convo.last_message || 'No messages yet'}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}