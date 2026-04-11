import { io } from 'socket.io-client'

let socket = null

export function connectSocket() {
  const token = localStorage.getItem('token')

  if (socket) {
    socket.disconnect()
    socket = null
  }

  // Use window.location so it always matches whatever host the browser is on
  const URL = `${window.location.protocol}//${window.location.hostname}:3001`

  socket = io(URL, {
    auth: { token },
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
  })

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message)
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}