const express = require("express")
const app = express()
const http = require("http").Server(app)
const io = require("socket.io")(http)

let data = {
    mouseX: [],
    mouseY: [],
    mousedown: [],
    color: [],
    sizes: [],
    users: []
}

//TODO: MAKE IT FASTER: MAYBE LOCALSTORAGE

app.use(express.static(__dirname))


app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html")
})

io.on("connection", (socket) => {

    socket.emit("assignUsername", socket.id)

    if (data.mouseX.length) {

        socket.emit("sendCanvas", data)
    }

    socket.on("drawing", (picture) => {
        if (picture && picture.clientX !== undefined) {
            if (picture.clientX) UpdateData(picture)
            socket.broadcast.emit('updateCanvas', data);

        }
    })

    socket.on("dropPicture", () => {
        data = {
            mouseX: [],
            mouseY: [],
            mousedown: [],
            color: [],
            sizes: [],
            users: []
        }
        io.sockets.emit("deletePicture", socket.id)
    })
})


function UpdateData(picture) {
    if (picture.clientX !== null) {
        if (picture.username !== data.users[data.users.length - 1]) {
            data.mouseX.push(picture.clientX)
            data.mouseY.push(picture.clientY)
            data.mousedown.push(false)
            data.color.push(picture.color)
            data.sizes.push(picture.size)
            data.users.push(picture.username)
        }
        data.mouseX.push(picture.clientX)
        data.mouseY.push(picture.clientY)
        data.mousedown.push(picture.isMouseDown)
        data.color.push(picture.color)
        data.sizes.push(picture.size)
        data.users.push(picture.username)
    }
}


http.listen(process.env.app_port || 8080, () => {
    console.log(`Server running on Port ${process.env.app_port || 8080}`)
})