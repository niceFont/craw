const express = require("express")
const app = express()
const http = require("http").Server(app)
const io = require("socket.io")(http)

let data = {
    mouseX: [],
    mouseY: [],
    mousedown: [],
}

app.use(express.static(__dirname))

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html")
})

io.on("connection", (socket) => {
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
}


http.listen(3000, () => {
    console.log("Server running on port 3000...")
})