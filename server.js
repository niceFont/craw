const express = require("express")
const app = express()
const http = require("http").Server(app)
const io = require("socket.io")(http, { wsEngine: 'ws' })
const cookieSession = require("cookie-session")

let data = {
    mouseX: [],
    mouseY: [],
    mousedown: [],
    color: [],
    sizes: [],
    users: [],
}


let socketID = null
let sessionID = null

app.use(express.static(__dirname))
app.use(cookieSession({
    name: "session",
    keys: ["key1"],
    maxAge: 7 * 24 * 60 * 60 * 1000
}))

app.get("/", (req, res) => {
    console.log(req.session)
    console.log(sessionID, "sessionid")
    req.session.id = (req.session.id || socketID)
    sessionID = req.session.id
    res.sendFile(__dirname + "/public/index.html")
})


io.on("connection", (socket) => {
    socketID = socket.id
    socket.emit("assignUsername", sessionID)

    socket.on("disconnect", () => {
        data.userCount--
    })

    if (data.mouseX.length) {
        socket.emit("renderConnectionCanvas", data)
    }


    socket.on("drawing", (picture) => {
        if (picture && picture.clientX !== undefined) {
            if (picture.clientX) UpdateData(picture)
            socket.broadcast.emit('updateCanvas', picture);
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