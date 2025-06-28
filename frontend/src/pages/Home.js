import React, { useState } from "react";
import { v4 as uuidV4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import { useEffect } from "react";
import io from 'socket.io-client';

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected to backend socket:", socket.id);
    });

    // Optional: show if any error
    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });
  }, []);

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidV4(); //unique id
    setRoomId(id);
    if (socket.connected) {
      socket.emit('create-room', id);
    } else {
      socket.once('connect', () => {
        socket.emit('create-room', id);
      });
    }
    toast.success("Successfully room created");
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (!roomId || !username) {
      toast.error("Room ID & Username required");
      return;
    }
    console.log("checking for room...");

    navigate(`/EditorPage/${roomId}`,
      { state: { username } });

  };

  const handleInput = (e) => {
    if (e.code === "Enter") {
      joinRoom(e);
    }
  };
  return (
    <div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <img src="/coolbackgrounds-particles-compute.png" alt="" class="absolute inset-0 -z-10 size-full object-cover object-right md:object-center"></img>
      <div class="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="mt-10 flex items-center gap-3">
          <img src="/logoNew2.png" alt="Logo" className="h-30 w-45" />

        </div>
      </div>

      <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form class="space-y-6" onSubmit={joinRoom}>
          <div>
            <div class="flex items-center justify-between">
              <label for="roomId" class="block text-sm/6 font-medium text-white">Room ID</label>
            </div>
            <div class="mt-2">
              <input type="text" name="roomId" id="roomId" onKeyUp={handleInput} onChange={(e) => setRoomId(e.target.value)} value={roomId} required class="block w-full rounded-md bg-transparent px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-indigo-600 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between">
              <label for="username" class="block text-sm/6 font-medium text-white">Username</label>
            </div>
            <div class="mt-2">
              <input type="text" name="username" id="username" onKeyUp={handleInput} onChange={(e) => setUsername(e.target.value)} value={username} required class="block w-full rounded-md bg-transparent px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-indigo-600 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>

          <div>
            <button type="submit" onClick={joinRoom} class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Join</button>
          </div>
        </form>

        <p class="mt-10 text-center text-sm/6 text-gray-200">
          If u don't have an invite then create
          &nbsp;<a href="#" class="font-semibold text-indigo-600 hover:text-indigo-500" onClick={createNewRoom}>New Room</a>
        </p>
      </div>
    </div>
  );
};

export default Home;