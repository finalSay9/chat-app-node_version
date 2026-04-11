import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { connectSocket, disconnectSocket } from '../lib/socket'
import api from '../lib/axios'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'

export default function ChatPage() {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [conversations, setConversations] = useState([])
  const [activeConvo, setActiveConvo] = useState(null)
  const [showSidebar, setShowSidebar] = useState(true)

  // Connect socket on mount
  useEffect(() => {
    const s = connectSocket()
    setSocket(s)

    s.on('user:online', ({ userId }) => {
      setConversations(prev => prev.map(c =>
        c.other_user_id === userId ? { ...c, is_online: true } : c
      ))
    })

    s.on('user:offline', ({ userId }) => {
      setConversations(prev => prev.map(c =>
        c.other_user_id === userId ? { ...c, is_online: false } : c
      ))
    })

    return () => disconnectSocket()
  }, [])

  // Load conversations
  useEffect(() => {
    api.get('/chat/conversations')
      .then(res => setConversations(res.data))
      .catch(console.error)
  }, [])

  function handleSelectConvo(convo) {
    setActiveConvo(convo)
    setShowSidebar(false) // on mobile, hide sidebar when chat opens
  }

  async function handleNewConvo(conversationId) {
    // Reload conversations to include the new one
    const res = await api.get('/chat/conversations')
    setConversations(res.data)
    const newConvo = res.data.find(c => c.id === conversationId)
    if (newConvo) handleSelectConvo(newConvo)
  }

  return (
    <div className="flex h-screen bg-[#0e1621] overflow-hidden">
      {/* Sidebar — always visible on desktop, toggleable on mobile */}
      <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex w-full md:w-80 h-full`}>
        <Sidebar
          conversations={conversations}
          activeId={activeConvo?.id}
          onSelect={handleSelectConvo}
          onNewConvo={handleNewConvo}
          socket={socket}
        />
      </div>

      {/* Chat window — hidden on mobile when sidebar is shown */}
      <div className={`${showSidebar ? 'hidden' : 'flex'} md:flex flex-1 h-full`}>
        <ChatWindow
          conversation={activeConvo}
          socket={socket}
          onBack={() => setShowSidebar(true)}
        />
      </div>
    </div>
  )
}