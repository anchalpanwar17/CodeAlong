import { React, useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from 'react-router-dom';
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

    const [members, setMembers] = useState([]);

    useEffect(() => {

        if (!username) {
            navigate('/', { replace: true });
            return;
        }

        const handleRoomMembers = (clients) => {
            console.log("Clients in room:", clients);
            setMembers(clients);
        };

        const joinRoom = () => {
            socket.emit('check-room', roomId, (exists) => {
                if (exists) {
                    socket.emit('join-room', { roomId, username });
                    console.log("Joining room:", roomId, username);
                } else {
                    toast.error("Room doesn't exist");
                    navigate('/', { replace: true });
                }
            });
        };

        if (socket.connected) {
            joinRoom();
        } else {
            socket.once('connect', joinRoom);
        }

        socket.on('room-members', handleRoomMembers);

        socket.on("user-joined", (name) => {
            toast.success(`${name} joined the chat`)
        });

        return () => {
            socket.off('room-members');
            socket.off('connect', joinRoom);
            socket.off("user-joined");
        };
    }, [roomId, username, navigate]);

    const [code, setCode] = useState('');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');

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
        const languageId = 54; // Example: 54 = C++, 71 = Python, 62 = Java


        try {
            const response = await fetch("http://localhost:5000/run", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    source_code: code,
                    language_id: languageId,
                    stdin: input || ""
                })
            });

            const result = await response.json();

            if (result.output) {
                setOutput(result.output);
                socket.emit("code-output", { roomId, output: result.output }); // 👈 broadcast output
            } else if (result.error) {
                setOutput(result.error);
                socket.emit("code-output", { roomId, output: result.error });
            } else {
                setOutput("No output received.");
                socket.emit("code-output", "No output received.");
            }

        } catch (err) {
            console.error("Run error:", err);
            setOutput("Something went wrong.");
        }

    };
    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div className="w-64 bg-gray-900 text-white p-4 flex flex-col">
                <div className="mb-8 pb-4 border-b border-gray-300">
                    <img src="/logoNew2.png" alt="Logo" className="h-10 mx-auto" />
                </div>

                <div className="flex-1 flex-row">
                    <p className="text-md font-semibold text-white-400 p-1 ml-3 mb-3">Members</p>
                    <div className="flex flex-row flex-wrap">
                        {members.map((member) => (
                            <Member key={member.socketId} username={member.username} />
                        ))}
                    </div>

                </div>

                {/* <button className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 mb-2" >Run / Compile Code</button> */}
                <button className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 mb-2">Copy Room ID</button>
                <div className="mt-4">
                    <textarea
                        placeholder="Input (stdin)..."
                        className="w-full h-24 p-2 rounded bg-gray-800 text-white mb-2"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            socket.emit("input-changed", { roomId, input: e.target.value });
                        }}
                    />
                    <button
                        onClick={handleRunCode}
                        className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 mb-2"
                    >
                        Run / Compile Code
                    </button>
                    <pre className="bg-black text-green-400 p-2 rounded h-48 overflow-auto">
                        {output}
                    </pre>
                </div>

            </div>

            {/* Editor Space */}
            <div className="flex-1 h-full bg-gray-100">
                <div className="h-full border bg-white">
                    <Editor roomId={roomId} username={username} onCodeChange={setCode} />
                </div>
            </div>

            <Chat roomId={roomId} username={username} />
            {/* <div className="flex-1 p-6"> */}
            {/* <h1 className="text-xl font-bold">Room ID: {roomId}</h1>
                <h2 className="text-md">Welcome, {username}</h2> */}
            {/* Your editor component here */}
            {/* </div> */}
        </div>
    );

}

export default EditorPage;
