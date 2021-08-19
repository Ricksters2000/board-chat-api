require('dotenv').config();

const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const knex = require('knex');
const cors = require('cors');
const upload = require('./middlewares/uploads');
const {s3Client} = require('./libs/s3Client');

const register = require('./controllers/register');
const signin = require('./controllers/signin');
const profile = require('./controllers/profile');

const app = express();

app.use(express.json());
app.use(express.static('public'));
app.use(cors());

const server = require('http').createServer(app);

const io = require('socket.io')(server, {
    cors: {origin: '*'}
})

const db = knex({
    client: 'pg',
    connection: process.env.POSTGRES_URI
})

const ROOM_PREFIX = 'room-';
let currentRoom = 1;
let amtInRoom = 0;

app.get('/', (req, res) => {
    res.send('eeee');
})

//handling profiles
app.get('/profile/:id', profile.handleProfileGet(db));
app.post('/profile/:id', upload.imageUploads.single('image'), profile.handleProfileUpdate(db, s3Client));
//authentication
app.post('/register', register.handleRegister(db, bcrypt, null));
app.post('/signin', signin.signinAuthentication(db, bcrypt, null));

//web socket
io.on('connection', (socket) => {
    // console.log('a user connected with id:', socket.id);
    // io.in(socket.id).socketsJoin(ROOM_PREFIX+currentRoom);
    socket.join(ROOM_PREFIX+currentRoom);
    // console.log('socket rooms:',socket.rooms)
    socket.on('message', (info) => {
        console.log(info);
        io.emit('message', `${JSON.stringify(info)}`);
    })
    socket.on('disconnect', (reason) => {
        console.log('socket:', socket.id, 'disconnected due to:', reason);
    })
    socket.on('end-turn', (options) => {
        console.log('ended turn with opts:', options)
        io.in(options.room).emit('end-turn', options);
    })
    socket.on('send-invite', (to, from) => {
        io.in(to).emit('receive-invite', {...from, socketId: socket.id});
    })
    socket.on('accept-invite', (to, from) => {
        
    })
})

io.of('/').adapter.on('join-room', (room, id) => {
    if(room === id) return;
    // console.log(`socket: ${id} joined room: ${room}`);
    amtInRoom++;
    if(amtInRoom === 1) {
        io.in(id).emit('game-started', 1, room);
    } else if(amtInRoom === 2) {
        amtInRoom = 0;
        currentRoom++;
        io.in(id).emit('game-started', 2, room);
    }
})

server.listen(8000, () => {
    console.log('app is running on port 8000');
})