import React from "react";
import { useParams, useLocation } from 'react-router-dom';
import Chat from "./chat";

function Editor() {
    const { roomId } = useParams();
    const location = useLocation();
    const username = location.state?.username || 'Guest';

    return (
    <div className="flex">
      <Chat roomId={roomId} username={username} />
      <div className="flex-1 p-6">
        <h1 className="text-xl font-bold">Room ID: {roomId}</h1>
        <h2 className="text-md">Welcome, {username}</h2>
        {/* Your editor component here */}
      </div>
    </div>
  );
}

export default Editor;
