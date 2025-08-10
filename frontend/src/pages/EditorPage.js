import { React, useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Member from "../components/Member";
import Editor from "../components/Editor";
import socket from "../socket";
import Chat from "./chat";

function EditorPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username;
  const [currentLine, setCurrentLine] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!username) {
      navigate("/", { replace: true });
      return;
    }

    const handleRoomMembers = (clients) => {
      setMembers(clients);
    };

    const joinRoom = () => {
      socket.emit("check-room", roomId, (exists) => {
        if (exists) {
          socket.emit("join-room", { roomId, username });
        } else {
          toast.error("Room doesn't exist");
          navigate("/", { replace: true });
        }
      });
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once("connect", joinRoom);
    }

    socket.on("room-members", handleRoomMembers);

    socket.on("user-joined", (name) => {
      toast.success(`${name} joined the chat`);
    });

    return () => {
      socket.off("room-members");
      socket.off("connect", joinRoom);
      socket.off("user-joined");
    };
  }, [roomId, username, navigate]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socket.id) {
        socket.emit("leave-room", { roomId, socketId: socket.id });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [roomId]);

  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  useEffect(() => {
    socket.on("input-changed", (newInput) => {
      setInput(newInput);
    });

    socket.on("code-output", (result) => {
      setOutput(result);
    });

    return () => {
      socket.off("input-changed");
      socket.off("code-output");
    };
  }, []);

  const handleRunCode = async () => {
    const languageId = 54;

    try {
      const response = await fetch("https://codealong-3nwz.onrender.com/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: input || "",
        }),
      });

      const result = await response.json();

      const finalOutput = result.output || result.error || "No output received.";
      setOutput(finalOutput);
      socket.emit("code-output", { roomId, output: finalOutput });

    } catch (err) {
      console.error("Run error:", err);
      setOutput("Something went wrong.");
    }
  };

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied to clipboard!");
    } catch {
      toast.error("Failed to copy Room ID");
    }
  };

  const handleSaveCodeFile = async () => {
    try {
      const blob = new Blob([code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "code.cpp";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to save code:", error);
    }
  };

  const handleLeaveRoom = () => {
    if (!socket.id) return;
    socket.emit("leave-room", { roomId, socketId: socket.id });
    socket.emit("release-locks", { roomId, exceptLine: currentLine, username });
    navigate("/", { replace: true });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4 flex flex-col overflow-y-auto no-scrollbar">
        <div className="mb-8 pb-4 border-b border-gray-300">
          <img src="/logoNew2.png" alt="Logo" className="h-10 mx-auto" />
        </div>

        <div className="flex-1">
          <p className="text-md font-semibold text-white-400 p-1 ml-3 mb-3">Members</p>
          <div className="flex flex-row flex-wrap">
            {members.map((member) => (
              <Member key={member.socketId} username={member.username} />
            ))}
          </div>
        </div>

        <button
          onClick={handleCopyRoomId}
          className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 mb-2"
        >
          Copy Room ID
        </button>
        <button
          onClick={handleSaveCodeFile}
          className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 mb-2"
        >
          Save Code File
        </button>
        <button
          onClick={handleLeaveRoom}
          className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 mb-2"
        >
          Leave Room
        </button>

        <div className="mt-4">
          <textarea
            placeholder="Input (stdin)..."
            className="w-full h-24 p-2 rounded bg-gray-800 text-white mb-2 resize-none no-scrollbar"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              socket.emit("input-changed", { roomId, input: e.target.value });
            }}
          />
          <button
            onClick={handleRunCode}
            className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 mb-2"
          >
            Run / Compile Code
          </button>
          <pre className="bg-black text-green-400 p-2 rounded h-48 overflow-auto no-scrollbar whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 h-full overflow-auto bg-gray-100 no-scrollbar">
        <div className="h-full w-full min-w-[1000px] overflow-auto no-scrollbar">
          <Editor
            roomId={roomId}
            username={username}
            onCodeChange={setCode}
            onCurrentLineChange={setCurrentLine}
          />
        </div>
      </div>

      {/* Chat */}
      <Chat roomId={roomId} username={username} />
    </div>
  );
}

export default EditorPage;
