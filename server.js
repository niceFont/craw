const express = require("express")
const app = express()
const http = require("http").Server(app)
const io = require("socket.io")(http)

let data = {
    mouseX: [],
    mouseY: [],
    mousedown: [],
    color: []
}

app.use(express.static(__dirname))

//TODO: Add creator functionality

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html")
})

//TODO: Send Picture on connection

io.on("connection", (socket) => {
    if(data.mouseX.length) socket.emit("updateCanvas", data)

    socket.on("drawing", (picture) => {

        if (picture.clientX !== undefined) {

            UpdateData(picture)
            io.sockets.emit("updateCanvas", data)

        }
    })
})


function UpdateData(picture) {
    data.mouseX[picture.localProgress] = picture.clientX
    data.mouseY[picture.localProgress] = picture.clientY
    data.mousedown[picture.localProgress] = picture.isMouseDown
    data.color[picture.localProgress] = picture.color
}


http.listen(3000, () => {
    console.log("Server running on port 3000...")
})