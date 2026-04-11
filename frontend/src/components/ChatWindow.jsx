import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/axios'
import MessageBubble from './MessageBubble'

export default function ChatWindow({ conversation, socket, onBack }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  // Load message history
  useEffect(() => {
    if (!conversation) return
    api.get(`/chat/conversations/${conversation.id}/messages`)
      .then(res => setMessages(res.data))
      .catch(console.error)
  }, [conversation])

  // Join socket room + listen for new messages
  useEffect(() => {
    if (!socket || !conversation) return
    socket.emit('conversation:join', conversation.id)

    function onMessage(msg) {
      if (msg.conversation_id === conversation.id) {
        setMessages(prev => [...prev, msg])
      }
    }

    socket.on('message:received', onMessage)
    return () => socket.off('message:received', onMessage)
  }, [socket, conversation])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || !socket) return
    socket.emit('message:send', {
      conversationId: conversation.id,
      content: input.trim(),
    })
    setInput('')
  }

  if (!conversation) {
    return (
      <div className="flex-1 hidden md:flex items-center justify-center bg-[#0e1621]">
        <div className="text-center text-[#7d8fa3]">
          <div className="w-24 h-24 rounded-full bg-[#17212b] flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm mt-1">Choose from your existing messages</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0e1621]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#17212b] border-b border-[#0d1824]">
        <button
          onClick={onBack}
          className="md:hidden text-[#7d8fa3] hover:text-white transition-colors mr-1"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-[#2b5278] flex items-center justify-center text-white font-semibold">
            {conversation.other_username[0].toUpperCase()}
          </div>
          {conversation.is_online && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#17212b]"/>
          )}
        </div>

        <div>
          <p className="text-white font-medium">{conversation.other_username}</p>
          <p className="text-xs text-[#7d8fa3]">
            {conversation.is_online ? 'online' : 'offline'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <p className="text-center text-[#7d8fa3] text-sm mt-8">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender_id === user.id}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="px-4 py-3 bg-[#17212b] flex items-center gap-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 bg-[#242f3d] text-white rounded-full px-5 py-3 outline-none text-sm placeholder-[#7d8fa3]"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="w-11 h-11 rounded-full bg-[#2b5278] hover:bg-[#3a6a9a] disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5 text-white rotate-45" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </form>
    </div>
  )
}