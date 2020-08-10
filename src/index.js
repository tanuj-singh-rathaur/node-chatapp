const path = require('path')
const express = require('express')
const http = require('http')
const app = express()
const socketio = require('socket.io')
const Filter = require('bad-words')

const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const port = process.env.PORT || 3000
const publicFileDirectory = path.join(__dirname, '../public')

app.use(express.static(publicFileDirectory))
const server = http.createServer(app)
const io = socketio(server)
io.on('connection', (socket) => {

    console.log('new websocket connection established')

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })
        if (error)
            return callback(error)

        socket.join(user.room)

        socket.emit('message', generateMessage('admin', 'welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage('admin', `a new user ${user.username} has joined`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })


    socket.on('send-message', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        if (filter.isProfane(message))
            return callback('profanity is not allowed')

        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('send-location', (url, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${url.latitude},${url.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage('admin', `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})



server.listen(port, () => {
    console.log(`server is running on port  ${port}`)
})