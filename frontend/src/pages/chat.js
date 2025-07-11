
import React, { useEffect, useState } from "react";
import { ArrowRightCircle } from "lucide-react"; // You can use this or any icon
import socket from "../socket";

const Chat = ({ roomId, username }) => {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  useEffect(() => {
    if (!roomId || !username) return;

    socket.emit("join-room", { roomId, username });

    const handleUserList = (userList) => {
      setUsers(userList);
    };

    const handleChatMessage = ({ username, message }) => {
      setChat((prev) => [...prev, { username, message }]);
    };

    const handleChatHistory = (history) => {
      setChat(history);
    };

    socket.on("user-list", handleUserList);
    socket.on("chat-message", handleChatMessage);
    socket.on("chat-history", handleChatHistory);

    return () => {
      socket.off("user-list", handleUserList);
      socket.off("chat-message", handleChatMessage);
      socket.off("chat-history", handleChatHistory);
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() !== "") {
      socket.emit("chat-message", { roomId, username, message });
      setMessage("");
    }
  };

  const getInitial = (name) => name?.charAt(0)?.toUpperCase();

  const getBubbleStyle = (index, isSystem = false) => {
    if (isSystem) return "bg-gray-700 text-gray-300 italic text-center";

    return index % 2 === 0
      ? "bg-purple-600 text-white"
      : "bg-indigo-600 text-white";
  };

  return (
    <div className="w-80 bg-gray-900 text-white flex flex-col p-4 h-screen">
      <div className="flex-1 mb-2 overflow-y-auto no-scrollbar">
        <h2 className="text-lg font-bold mb-4">💬 Live Chat</h2>
        <div className="space-y-3 max-h-[80vh] overflow-y-auto no-scrollbar pr-2">
          {chat.map((c, i) => (
            <div
              key={i}
              className={`flex items-start space-x-3 ${
                c.username === "System" ? "justify-center" : ""
              }`}
            >
              {c.username !== "System" && (
                <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white font-bold text-sm">
                  {getInitial(c.username)}
                </div>
              )}
              <div
                className={`px-4 py-2 rounded-lg text-sm leading-snug break-words max-w-[70%] ${getBubbleStyle(
                  i,
                  c.username === "System"
                )}`}
              >
                {c.username !== "System" && (
                  <p className="font-semibold mb-1">{c.username}</p>
                )}
                {c.message}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={sendMessage} className="relative flex mt-4">
        <input
          type="text"
          placeholder="Type a message..."
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-pink-400 transition"
        >
          <ArrowRightCircle size={24} />
        </button>
      </form>
    </div>
  );
};

export default Chat;


