require('dotenv').config();

const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const knex = require('knex');
const redis = require('redis');
const cors = require('cors');
const upload = require('./middlewares/uploads');
const {s3Client} = require('./libs/s3Client');
const {parse} = require('pg-connection-string');

const register = require('./controllers/register');
const signin = require('./controllers/signin');
const profile = require('./controllers/profile');
const generateUniqueId = require('./libs/idGeneration');

const db = knex({
    client: 'pg',
    connection: {
        ...parse(process.env.DATABASE_URL),
        ssl: {rejectUnauthorized: false}
    }
})

const client = redis.createClient(process.env.REDIS_URI);

const app = express();

app.use(express.json());
app.use(express.static('public'));
app.use(cors());

const server = require('http').createServer(app);

const io = require('socket.io')(server, {
    cors: {origin: '*'}
})

app.get('/', (req, res) => {
    db('users').returning('*')
        .then(users => {
            res.json(users);
        }).catch(err => res.status(400).json(err))
})

//handling profiles
app.get('/profile/:id', profile.handleProfileGet(db));
app.post('/profile/:id', upload.errCheck(upload.imageUploads, 'image'), profile.handleProfileUpdate(db, s3Client));
app.put('/profile/win/:id', profile.handleProfileWin(db));

app.post('/temp/img', upload.errCheck(upload.tempUploads, 'image'), profile.handleTempImage);
//authentication
app.post('/register', register.handleRegister(db, bcrypt, null));
app.post('/signin', signin.signinAuthentication(db, bcrypt, null));

//web socket
io.on('connection', (socket) => {
    // console.log('a user connected with id:', socket.id);
    socket.on('message', (info) => {
        // console.log(info);
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
        console.log('invite sent to:', to, 'from:', from);
        io.in(to).emit('receive-invite', {...from, socketId: socket.id});
    })
    socket.on('accept-invite', (toId, game) => {
        const roomId = generateUniqueId();
        console.log('creating room id:', roomId);
        socket.join(roomId);
        io.in(toId).socketsJoin(roomId);
        io.in(roomId).emit('load-game', game, roomId);
    })
    socket.on('ready-up', (roomId) => {
        client.incr(roomId, (err, reply) => {
            console.log('player ready in room:', roomId, 'amount ready:', reply);

            if(reply === 2) {
                io.in(roomId).emit('game-started', socket.id);

                client.del(roomId);
            }
        });
    })
    socket.on('send-user-id', (userId, roomId) => {
        io.in(roomId).emit('get-user-id', userId);
    })
})

server.listen(process.env.PORT || 8000, () => {
    console.log(`app is running on port ${process.env.PORT || 8000}`);
})