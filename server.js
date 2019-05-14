const express = require("express")
const app = express()
const http = require("http").Server(app)
const io = require("socket.io")(http)

let data = {
    mouseX: [],
    mouseY: [],
    mousedown: [],
    color: [],
    sizes: []
}


app.use(express.static(__dirname))


app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html")
})

io.on("connection", (socket) => {
    if (data.mouseX.length) {

        socket.emit("sendCanvas", data)
    }

    socket.on("drawing", (picture) => {
        if (picture.clientX !== undefined) {

            socket.broadcast.emit('updateCanvas', picture);
            if (picture.clientX) UpdateData(picture)
        }
    })

    socket.on("dropPicture", () => {
        data = {
            mouseX: [],
            mouseY: [],
            mousedown: [],
            color: [],
            sizes: []
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
    }
}


http.listen(process.env.app_port || 8080, () => {
    console.log(`Server running on Port ${process.env.app_port || 8080}`)
})