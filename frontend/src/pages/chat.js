import React, { useEffect, useState } from "react";
import socket from "../socket";

const Chat = ({ roomId, username }) => {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

//   useEffect(() => {
//     if (!roomId || !username) return;
//     socket.emit("join-room", { roomId, username });
//     socket.on("user-list", (user) => {
//       console.log(user)
//       setUsers(user);
//     });

//     socket.on("chat-message", ({ username, message }) => {
//       setChat((prev) => [...prev, { username, message }]);
//     });

//     socket.on("user-joined", (name) => {
//       setChat((prev) => [
//         ...prev,
//         { username: "System", message: `${name} joined the chat` },
//       ]);
//     });

//     return () => {
//       socket.off("user-list");
//       socket.off("chat-message");
//       socket.off("user-joined");
//       //socket.off("user-left");
//     };
//   }, [roomId, username]);
  useEffect(() => {
  if (!roomId || !username) return;

  socket.emit("join-room", { roomId, username });

  const handleUserList = (userList) => {
    console.log("👥 User List Received:", userList);
    setUsers(userList);
  };

  const handleChatMessage = ({ username, message }) => {
    console.log("💬 Chat message received:", username, message);
    setChat((prev) => [...prev, { username, message }]);
  };

  const handleUserJoined = (name) => {
    setChat((prev) => [
      ...prev,
      { username: "System", message: `${name} joined the chat` },
    ]);
  };

  // Listen
  socket.on("user-list", handleUserList);
  socket.on("chat-message", handleChatMessage);
  socket.on("user-joined", handleUserJoined);

  // Clean up
//   return () => {
//     socket.off("user-list", handleUserList);
//     socket.off("chat-message", handleChatMessage);
//     socket.off("user-joined", handleUserJoined);
//   };
}, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() !== "") {
      socket.emit("chat-message", { roomId, username, message });
      setChat((prev) => [...prev, { username, message }]);
      setMessage("");
    }
  };
  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col p-4 h-screen overflow-y-auto">
      <h2 className="text-lg font-bold mb-2">Users</h2>
      <ul className="mb-4">
        {users.map((u) => (
          <li key={u.socketId} className="text-sm">👤 {u.username}</li>
        ))}
      </ul>
      <div className="flex-1 mb-2 overflow-y-auto">
        <h2 className="text-lg font-bold mb-2">Chat</h2>
        <div className="space-y-1 text-sm max-h-64 overflow-y-scroll">
          {chat.map((c, i) => (
            <div key={i}>
              <strong>{c.username}: </strong>{c.message}
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={sendMessage} className="mt-auto">
        <input
          type="text"
          placeholder="Type a message..."
          className="w-full p-2 bg-gray-800 border rounded"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </form>
    </div>
  );
};

export default Chat;
