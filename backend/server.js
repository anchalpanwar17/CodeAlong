require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const encode = (str) => Buffer.from(str).toString("base64");
const decode = (str) => Buffer.from(str, 'base64').toString();

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send("Socket.IO server is up and running 🚀");
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

const rooms = new Set();
const roomsMap = new Map();
const chatHistory = new Map();
const codeMap = new Map();
const inputMap = new Map();
const outputMap = new Map();
const lineLocks = new Map(); // roomId -> { lineNumber: username }


io.on('connect', (socket) => {
  console.log(`Socket connected : ${socket.id}`);

  console.log("Rooms Map : ", roomsMap);


  socket.on('create-room', (roomId) => {
    rooms.add(roomId);
    // socket.join(roomId);
    console.log(`Room created : ${roomId}`);
  });

  socket.on('check-room', (roomId, callback) => {
    if (rooms.has(roomId)) {
      callback(true);
    } else {
      callback(false);
    }
  });


  socket.on('join-room', ({ roomId, username }) => {
    if (rooms.has(roomId)) {

      let clients = roomsMap.get(roomId) || [];

      // console.log("mai pagal ho jaungi agr ye fix nhi hua toh");


      //prevent multiple entries from same user socket ids
      if (clients.some(client => client.socketId === socket.id)) {
        // console.log("Socket already present");
        return; // socket already joined
      }

      // // ✅ Prevent same username joining again and on refreshing users disappear
      // if (clients.some(client => client.username === username)) {
      //   console.log("prevent same user form joining");
      //   // socket.emit('username-already-taken');
      //   return;
      // }


      socket.join(roomId);
      console.log(`${socket.id} joined ${roomId}`); /////
      socket.username = username;
      socket.roomId = roomId;

      clients = clients.filter(client => client.username !== username); //on refresh users persist and when user join with same uername the older one is replaced

      clients.push({ socketId: socket.id, username });
      roomsMap.set(roomId, clients);

      console.log("Rooms Map : ", roomsMap); //////

      io.to(roomId).emit('room-members', clients);
      const history = chatHistory.get(roomId) || [];
      socket.emit('chat-history', history);


      const latestCode = codeMap.get(roomId);
      if (latestCode) {
        socket.emit('code-sync', { code: latestCode });
      }

      socket.on('code-change', ({ roomId, code }) => {
        codeMap.set(roomId, code);
        socket.to(roomId).emit('code-change', { code });
      });

      const latestInput = inputMap.get(roomId);
      if (latestInput) {
        socket.emit("input-changed", latestInput);
      }

      const latestOutput = outputMap.get(roomId);
      if (latestOutput) {
        socket.emit("code-output", latestOutput);
      }

    }
  });

  // const joinRoom = () => {
  //   console.log("Trying to join room:", roomId);

  //   // 1. Check if room exists
  //   socket.emit('check-room', roomId, (exists) => {
  //     if (!exists) {
  //       toast.error("Room doesn't exist");
  //       navigate('/', { replace: true });
  //       return;
  //     }

  //     // 2. Check if username already exists in room
  //     socket.emit('get-room-members', roomId, (clients) => {
  //       const duplicate = clients.some(client =>
  //         client.username === username && client.socketId !== socket.id // important condition
  //       );

  //       if (duplicate) {
  //         toast.error("Username already taken in this room");
  //         navigate('/', { replace: true });
  //         return;
  //       }

  //       // 3. Now safe to join
  //       socket.emit('join-room', { roomId, username });
  //       console.log("Joining room:", roomId, username);
  //     });
  //   });
  // };


  socket.on('leave-room', ({ roomId, socketId }) => {
    let clients = roomsMap.get(roomId) || [];

    const leavingClient = clients.find(c => c.socketId === socketId);
    const username = leavingClient?.username;

    // ✅ Remove line locks by this user
    if (username) {
      const roomLocks = lineLocks.get(roomId) || {};
      let updated = false;

      for (const line in roomLocks) {
        if (roomLocks[line] === username) {
          delete roomLocks[line];
          updated = true;
          io.to(roomId).emit('line-unlocked', { lineNumber: parseInt(line) });
        }
      }

      if (updated) {
        lineLocks.set(roomId, roomLocks);
      }
    }

    // ✅ Remove from members list
    clients = clients.filter(client => client.socketId !== socketId);
    if (clients.length === 0) {
      roomsMap.delete(roomId);
    } else {
      roomsMap.set(roomId, clients);
    }

    socket.leave(roomId);
    io.to(roomId).emit('room-members', clients);
    console.log(`${socketId} left room ${roomId}`);
  });



  socket.on('chat-message', ({ roomId, username, message }) => {

    const history = chatHistory.get(roomId) || [];
    history.push({ username, message });
    chatHistory.set(roomId, history);
    console.log(history)
    io.to(roomId).emit('chat-message', { username, message });
    socket.emit('chat-history', history);
  });

  // socket.on('code-change', ({ roomId, code }) => {
  //   codeMap.set(roomId, code);
  //   socket.to(roomId).emit('code-change', { code });
  // });

  socket.on("input-changed", ({ roomId, input }) => {
    inputMap.set(roomId, input);
    socket.to(roomId).emit("input-changed", input);
  });
  socket.on("code-output", ({ roomId, output }) => {
    outputMap.set(roomId, output);
    socket.to(roomId).emit("code-output", output);
  });
  //line locking mechanism
  socket.on('line-lock', ({ roomId, lineNumber, username }) => {
    const roomLocks = lineLocks.get(roomId) || {};

    if (roomLocks[lineNumber] && roomLocks[lineNumber] !== username) {
      // Notify user that the line is locked
      io.to(socket.id).emit('line-locked', {
        lineNumber,
        lockedBy: roomLocks[lineNumber]
      });
      return;
    }

    roomLocks[lineNumber] = username;
    lineLocks.set(roomId, roomLocks);
  });

  socket.on('release-locks', ({ roomId, exceptLine, username }) => {
    const locks = lineLocks.get(roomId) || {};

    for (const [lineStr, lockedBy] of Object.entries(locks)) {
      const line = parseInt(lineStr);
      if (lockedBy === username && line !== exceptLine) {
        delete locks[line];
        io.to(roomId).emit('line-unlocked', { lineNumber: line });
      }
    }
    lineLocks.set(roomId, locks);
  });
  // socket.on('disconnect', () => {
  //   socket.on('disconnect', () => {
  //     // Clean all locks by this user
  //     for (const [roomId, locks] of lineLocks.entries()) {
  //       for (const line in locks) {
  //         if (locks[line] === socket.username) {
  //           delete locks[line];
  //         }
  //       }
  //       lineLocks.set(roomId, locks);
  //     }
  //   });

  socket.on('disconnect', () => {
    const username = socket.username;
    const roomId = socket.roomId;

    console.log(`Socket disconnected : ${socket.id}, User: ${username}, Room: ${roomId}`);

    // ✅ Step 1: Release all line locks by this user
    if (roomId && username) {
      const roomLocks = lineLocks.get(roomId) || {};
      let updated = false;

      for (const line in roomLocks) {
        if (roomLocks[line] === username) {
          delete roomLocks[line];
          updated = true;
          io.to(roomId).emit('line-unlocked', { lineNumber: parseInt(line) });
        }
      }

      if (updated) {
        lineLocks.set(roomId, roomLocks);
      }
    }

    // ✅ Step 2: Remove user from room members
    if (roomId) {
      let clients = roomsMap.get(roomId) || [];
      clients = clients.filter(client => client.socketId !== socket.id);

      if (clients.length === 0) {
        roomsMap.delete(roomId);
      } else {
        roomsMap.set(roomId, clients);
      }

      io.to(roomId).emit('room-members', clients);
    }
  });


  console.log(`Socket disconnected : ${socket.id}`);

});

const axios = require("axios");
app.use(express.json()); // To parse JSON body


app.post('/run', async (req, res) => {

  const { source_code, language_id, stdin } = req.body;
  if (!source_code || source_code.trim() === '') {
    return res.status(400).json({ error: "Code is required!" });
  }

  const encodedCode = encode(source_code);
  const encodedInput = encode(stdin);

  try {
    // Step 1: Submit Code
    const submissionRes = await axios.post(
      'https://judge0-ce.p.rapidapi.com/submissions',
      {
        source_code: encodedCode,
        language_id: language_id,
        stdin: encodedInput
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': '8f0224de8cmshac0096f8b4eb45bp10d936jsn97315f1c2f05',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        params: {
          base64_encoded: 'true',
          fields: '*'
        }
      }
    );

    const token = submissionRes.data.token;

    // Step 2: Poll for result
    let outputRes;
    while (true) {
      outputRes = await axios.get(
        `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
        {
          headers: {
            'X-RapidAPI-Key': '8f0224de8cmshac0096f8b4eb45bp10d936jsn97315f1c2f05',
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
          },
          params: {
            base64_encoded: 'true',
            fields: '*'
          }
        }
      );

      if (outputRes.data.status.id > 2) break; // status_id 1 or 2 means queued/in progress
    }

    // Step 3: Decode and send back
    const decodedOutput = decode(outputRes.data.stdout || '');
    const decodedError = decode(outputRes.data.stderr || '');
    const decodedCompile = decode(outputRes.data.compile_output || '');

    let finalOutput = '';
    if (outputRes.data.status.id !== 3) {
      finalOutput = decodedCompile || decodedError || "Unknown error";
    } else {
      finalOutput = decodedOutput;
    }

    res.json({
      status: outputRes.data.status.description,
      output: finalOutput
    });

  } catch (err) {
    console.error("Judge0 error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Code execution failed",
      details: err.response?.data || err.message
    });
  }
});

// Serve frontend
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});


server.listen(5000, () => {
  console.log("Server running on port 5000");
});
