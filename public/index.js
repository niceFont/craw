window.onload = function () {

    const socket = io()
    const canvas = document.getElementById("myCanvas")
    const ctx = canvas.getContext("2d")
    const buttons = document.getElementsByClassName("color-button")
    const eraser = document.getElementById("eraser")
    const trash = document.getElementById("trash")
    const slider = document.getElementById("mySlider")
    const sliderCount = document.getElementById("sliderCount")

    let localUsername
    let localProgress = 0
    let serverProgress = 0
    let localColor = ctx.strokeStyle
    let localData = {
        mouseX: [],
        mouseY: [],
        mousedown: [],
        color: [],
        sizes: []
    }
    let isDrawing = false
    let prevX = 0
    let prevY = 0
    let localSize = 3

    ctx.strokeStyle = "#00000"
    ctx.lineJoin = "round"
    ctx.lineWidth = 3

    sliderCount.innerHTML = 3

    Array.prototype.forEach.call(buttons, element => {
        element.onclick = function (e) {
            let color = window.getComputedStyle(element).getPropertyValue("background-color")
            ctx.strokeStyle = color
            localColor = color
        }
    })

    socket.on("assignUsername", (username) => {
        localUsername = username
    })

    socket.on("updateCanvas", AddSocketData)

    socket.on("sendCanvas", AddConnectionSocketData)

    socket.on("deletePicture", DeletePicture)


    eraser.onclick = function () {
        ctx.strokeStyle = "#FFFFFF"
        localColor = "#FFFFFF"
    }

    trash.onclick = function () {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        socket.emit("dropPicture")
    }

    slider.oninput = function (e) {
        localSize = this.value
        ctx.lineWidth = this.value
        sliderCount.innerHTML = this.value
    }

    canvas.onmousemove = function (e) {

        if (isDrawing) {

            AddMousePos(e.clientX - this.offsetLeft, e.clientY - this.offsetTop, true)
            LocalDraw()
        }
    }

    canvas.onmousedown = function (e) {

        isDrawing = true
        AddMousePos(e.clientX - this.offsetLeft, e.clientY - this.offsetTop, false)
        LocalDraw()
    }

    canvas.onmouseleave = function () {
        isDrawing = false
    }

    canvas.onmouseup = function (e) {
        isDrawing = false
    }

    function LocalDraw() {

        for (let i = localProgress; i < localData.mouseX.length; i++) {
            ctx.beginPath()
            ctx.strokeStyle = localData.color[i]
            if (localData.mousedown[i] && i) ctx.moveTo(localData.mouseX[i - 1], localData.mouseY[i - 1])
            else ctx.moveTo(localData.mouseX[i] - 1, localData.mouseY[i])
            ctx.lineTo(localData.mouseX[i], localData.mouseY[i])
            ctx.strokeStyle = localData.color[i]
            ctx.lineWidth = localData.sizes[i]
            ctx.closePath()
            ctx.stroke()
            localProgress++
            console.log("local")
        }
        ctx.strokeStyle = localColor
        ctx.lineWidth = localSize
        ctx.save()
    }


    function UpdateDrawing(data) {

        for (let i = serverProgress; i < data.mouseX.length; i++) {
            if (data.users[i] !== localUsername) {
                ctx.beginPath()

                if (data.mousedown[i] && i) ctx.moveTo(data.mouseX[i - 1], data.mouseY[i - 1])
                else ctx.moveTo(data.mouseX[i] - 1, data.mouseY[i])
                console.log("server")
                console.log(data)
                ctx.lineTo(data.mouseX[i], data.mouseY[i])
                ctx.strokeStyle = data.color[i]
                ctx.lineWidth = data.sizes[i]
                ctx.closePath()
                ctx.stroke()
                serverProgress++
            }
        }
        ctx.strokeStyle = localColor
        ctx.lineWidth = localSize
        ctx.save()
    }


    function AddMousePos(clientX, clientY, isMouseDown) {

        if (prevX !== clientX || prevY !== clientY && clientX !== undefined) {
            let data = {
                clientX,
                clientY,
                isMouseDown,
                color: ctx.strokeStyle,
                size: ctx.lineWidth,
                username: localUsername
            }
            localData.mouseX.push(clientX)
            localData.mouseY.push(clientY)
            localData.mousedown.push(isMouseDown)
            localData.color.push(ctx.strokeStyle)
            localData.sizes.push(ctx.lineWidth)
            socket.emit("drawing", data)
            prevX = clientX
            prevY = clientY
        }
    }



    function AddSocketData(data) {
        if (Object.keys(data).length) {
            /* localData.mouseX.push(data.clientX)
            localData.mouseY.push(data.clientY)
            localData.mousedown.push(data.isMouseDown)
            localData.color.push(data.color)
            localData.sizes.push(data.size) */

            UpdateDrawing(data)
        }
    }

    function AddConnectionSocketData(data) {
        if (Object.keys(data).length) {
            /* localData.mouseX.push(...data.mouseX)
            localData.mouseY.push(...data.mouseY)
            localData.mousedown.push(...data.mousedown)
            localData.color.push(...data.color)
            localData.sizes.push(...data.sizes) */
            UpdateDrawing(data)
        }
    }


    function DeletePicture() {
        localProgress = 0
        serverProgress = 0
        localData = {
            mouseX: [],
            mouseY: [],
            mousedown: [],
            color: [],
            sizes: [],
            users: []
        }
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    }
}