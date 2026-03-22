import React from 'react'
import Avatar from 'react-avatar'

const User = (props) => {

  return (
    <div className="flex flex-col gap-1 text-white items-center">
      <div className="relative w-fit">
        <Avatar name={props.username} size='60' className={`rounded-xl transition-all duration-300 ${props.isSpeaking ? 'ring-4 ring-green-500 animate-pulse' : ''}`} />
        <span
          className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border border-zinc-900"
          style={{ backgroundColor: props.color || "#94A3B8" }}
        />

        {/* Kick Button */}
        {props.isAdmin && props.socketId !== props.mySocketId && (
          <button
            onClick={() => props.onKick(props.socketId)}
            className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 text-white text-xs px-2 py-0.5 rounded-md shadow-md"
          >
            Kick
          </button>
        )}
      </div>

      <span className='username'>{props.username}</span>
    </div>
  )
}

export default User
