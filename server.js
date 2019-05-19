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
    users: [],
}


app.use(express.static(__dirname))


app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html")
})


io.on("connection", (socket) => {
    data.userCount++
    socket.emit("assignUsername", socket.id)

    socket.on("disconnect", () => {
        data.userCount--
    })

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
            users: [],
            userCount: data.userCount
        }
        io.sockets.emit("deletePicture", socket.id)
    })
})


function UpdateData(picture) {
    if (picture.clientX !== null) {
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