export default function MessageBubble({ message, isOwn }) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className={`flex mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
        isOwn
          ? 'bg-[#2b5278] text-white rounded-br-sm'
          : 'bg-[#182533] text-white rounded-bl-sm'
      }`}>
        <p>{message.content}</p>
        <span className={`text-[10px] mt-1 block text-right ${isOwn ? 'text-[#7ab3e8]' : 'text-[#7d8fa3]'}`}>
          {time}
        </span>
      </div>
    </div>
  )
}