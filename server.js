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


app.use(express.static(__dirname))


app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html")
})


io.on("connection", (socket) => {
    if (data.mouseX.length) socket.emit("updateCanvas", data)

    socket.on("drawing", (picture) => {


        if (picture.clientX !== undefined) {

            io.sockets.emit("updateCanvas", picture)
        }
    })

    socket.on("dropPicture", () => {
        io.sockets.emit("deletePicture", socket.id)
    })
})


/* function UpdateData(picture) {
    data.mouseX[picture.localProgress] = picture.clientX
    data.mouseY[picture.localProgress] = picture.clientY
    data.mousedown[picture.localProgress] = picture.isMouseDown
    data.color[picture.localProgress] = picture.color
} */


http.listen(process.env.app_port || 8080, () => {
    console.log("Server running on port 3000...")
})