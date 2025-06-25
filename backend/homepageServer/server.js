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
const userSocketMap = {};

function getAllConnectedClients(roomId){
    //Map
    return Array.from(io.sockets.adapter.rooms.get(roomId)|| []).map((socketId)=>{
        return {
            socketId,
            username: userSocketMap[socketId],
        }
    });
}

io.on('connect', (socket) => {
    console.log(`Socket connected : ${socket.id}`);

    socket.on('create-room', (roomId) => {
        rooms.add(roomId);
        socket.join(roomId);
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
        console.log('🔥 join-room event fired with data:', roomId, username); 
        if(rooms.has(roomId)){
            userSocketMap[socket.id] = username;
            socket.join(roomId);
            const clients = getAllConnectedClients(roomId)
            console.log(`${socket.id} joined ${roomId}`, clients);
            //console.log(clients);
            // clients.forEach(({socketId})=>{
            //     io.to(socketId).emit('user-list',{
            //        clients,
            //        username,
            //        socketId: socket.id,
            //     })
            //     // Notify others
            //     socket.to(roomId).emit('user-joined', username);
            // })
             io.to(roomId).emit('user-list', clients); // ✅ send proper list
             socket.to(roomId).emit('user-joined', username); // ✅ notify others

        }
    });

    socket.on('chat-message', ({roomId, username, message})=>{
        io.to(roomId).emit('chat-message', {username, message});
    })

    socket.on('disconnect', () => {
        console.log(`Socket disconnected : ${socket.id}`);
    });
});

server.listen(5000, () => {
    console.log("Server running on port 5000");
});
