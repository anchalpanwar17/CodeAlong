const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send("Socket.IO server is up and running 🚀");
});

const server = http.createServer(app);
const io = new Server(server, {
    cors : {
        origin : "http://localhost:3000",
        methods : ["GET", "POST"],
    },
});

const rooms = new Set();
const roomsMap = new Map();
const chatHistory = new Map(); 

io.on('connect', (socket) => {
    console.log(`Socket connected : ${socket.id}`);

    socket.on('create-room', (roomId) => {
        rooms.add(roomId);
        // socket.join(roomId);
        console.log(`Room created : ${roomId}`);
    });

    socket.on('check-room', (roomId, callback) => {
        if(rooms.has(roomId)){
            callback(true);
        }else{
            callback(false);
        }
    });

    socket.on('join-room', ({roomId, username}) => {
        if(rooms.has(roomId)){

            socket.join(roomId);
            console.log(`${socket.id} joined ${roomId}`);

            let clients = roomsMap.get(roomId) || [];

            clients = clients.filter(client => client.username !== username);
          
            clients.push({socketId: socket.id, username});
            roomsMap.set(roomId, clients);

            console.log(roomsMap);   

            io.to(roomId).emit('room-members', clients);
            const history = chatHistory.get(roomId) || [];
            socket.emit('chat-history', history); 

        }
    });

    socket.on('chat-message', ({roomId, username, message})=>{

        const history = chatHistory.get(roomId) || [];
        history.push({ username, message });
        chatHistory.set(roomId, history);
        console.log(history)
        io.to(roomId).emit('chat-message', {username, message});
         socket.emit('chat-history', history); 
    })

    socket.on('disconnect', () => {
        console.log(`Socket disconnected : ${socket.id}`);
    });
});

server.listen(5000, () => {
    console.log("Server running on port 5000");
});
