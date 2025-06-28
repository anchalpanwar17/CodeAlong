import React from 'react'
import Avatar from 'react-avatar'

const Member = ({key, username}) => {
    // console.log(username);
    return (
        <div className="flex flex-col items-center gap-1 p-1">
            <Avatar name={username} 
            size={50}
            round="14px"
            />
            <span className="text-sm font-semibold text-center break-words w-16">{username}</span>
        </div>
    )
}

export default Member