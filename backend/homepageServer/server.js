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
<<<<<<< Updated upstream
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
=======
const roomsMap = new Map();
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
        console.log('🔥 join-room event fired with data:', roomId, username); 
=======
>>>>>>> Stashed changes
        if(rooms.has(roomId)){
            userSocketMap[socket.id] = username;
            socket.join(roomId);
<<<<<<< Updated upstream
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
             io.to(roomId).emit('user-list', clients);
             socket.to(roomId).emit('user-joined', username);

=======
            console.log(`${socket.id} joined ${roomId}`);

            let clients = roomsMap.get(roomId) || [];

            clients = clients.filter(client => client.username !== username);
          
            clients.push({socketId: socket.id, username});
            roomsMap.set(roomId, clients);

            console.log(roomsMap);   

            io.to(roomId).emit('room-members', clients);
            
>>>>>>> Stashed changes
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
