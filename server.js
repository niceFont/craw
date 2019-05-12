const express = require("express")
const app = express()
const http = require("http").Server(app)
const io = require("socket.io")(http)

let data = {
    mouseX: [],
    mouseY: [],
    mousedown: [],
    color: [],

}

let prevCoord = {}
let prevSocketId

let t = 0
app.use(express.static(__dirname))


app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html")
})


io.on("connection", (socket) => {
    if (data.mouseX.length) socket.emit("updateCanvas", data)

    socket.on("drawing", (picture) => {

        if (picture.clientX !== undefined) {
            if (!checkSocket(socket, picture)) {

                UpdateData(picture)
                io.sockets.emit("updateCanvas", data)
            }

            prevCoord = picture
            prevSocketId = socket.id

        }
    })

    socket.on("dropPicture", () => {
        data = {
            mouseX: [],
            mouseY: [],
            mousedown: [],
            color: [],

        }
    })
})


function UpdateData(picture) {
    data.mouseX[picture.localProgress] = picture.clientX
    data.mouseY[picture.localProgress] = picture.clientY
    data.mousedown[picture.localProgress] = picture.isMouseDown
    data.color[picture.localProgress] = picture.color
}

function checkSocket(socket, picture) {

    if (socket.id === prevSocketId) {
        if (picture.clientX[picture.clientX.length - 1] === prevCoord.clientX) {
            if (picture.clientY[picture.clientY.length - 1] === prevCoord.clientY) {
                if (picture.clientX[picture.isMouseDown.length - 1] === prevCoord.isMouseDown) {
                    return true
                }
            }
        }
    }
    return false
}

http.listen(process.env.app_port || 8080, () => {
    console.log("Server running on port 3000...")
})