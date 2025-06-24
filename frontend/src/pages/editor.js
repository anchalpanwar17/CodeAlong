import React from "react";
import { useParams, useLocation } from 'react-router-dom';

function Editor() {
    const { roomId } = useParams();
    const location = useLocation();
    const username = location.state?.username || 'Guest';

    return (
        <div>
            <h1>Room ID: {roomId}</h1>
            <h2>Welcome, {username}</h2>
            {/* Your collaborative editor logic here */}
        </div>
    );
}

export default Editor;
