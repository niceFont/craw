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

// TODO: Send Picture on Connect
//FixMe: Getting Null values
io.on("connection", (socket) => {
    console.log("data")
    if (data.mouseX.length) {

        socket.emit("sendCanvas", data)
    }

    socket.on("drawing", (picture) => {


        if (picture.clientX !== undefined) {
            if (picture.clientX === null) console.log(picture.clientX)
            socket.broadcast.emit('updateCanvas', picture);

            //io.sockets.emit("updateCanvas", picture)
            if (picture.clientX) UpdateData(picture)
        }
    })

    socket.on("dropPicture", () => {

        io.sockets.emit("deletePicture", socket.id)
    })
})


function UpdateData(picture) {
    if (picture.clientX !== null) {
        data.mouseX.push(picture.clientX)
        data.mouseY.push(picture.clientY)
        data.mousedown.push(picture.isMouseDown)
        data.color.push(picture.color)
    }
}


http.listen(process.env.app_port || 8080, () => {
    console.log("Server running on port 3000...")
})