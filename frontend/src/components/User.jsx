import React from 'react'
import Avatar from 'react-avatar'


const User = (props) => {

  return (
    <div className="flex flex-col gap-1 text-white" >
      <div className="relative">
        <Avatar name={props.username} size='60' className="rounded-xl " />
        <span
          className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border border-zinc-900"
          style={{ backgroundColor: props.color || "#94A3B8" }}
        />
      </div>

      <span className='username'>{props.username}</span>
    </div>
  ) 
}

export default User
