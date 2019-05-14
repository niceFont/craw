window.onload = function () {

    const socket = io()
    const canvas = document.getElementById("myCanvas")
    const ctx = canvas.getContext("2d")
    const buttons = document.getElementsByClassName("color-button")
    const eraser = document.getElementById("eraser")
    const trash = document.getElementById("trash")


    let localProgress = 0
    let localColor = ctx.strokeStyle
    let localData = {
        mouseX: [],
        mouseY: [],
        mousedown: [],
        color: []
    }
    let isDrawing = false
    let prevX = 0
    let prevY = 0

    ctx.strokeStyle = "#00000"
    ctx.lineJoin = "round"
    ctx.lineWidth = 3

    Array.prototype.forEach.call(buttons, element => {
        element.onclick = function (e) {
            let color = window.getComputedStyle(element).getPropertyValue("background-color")
            ctx.strokeStyle = color
            localColor = color
        }
    })


    eraser.onclick = function () {
        ctx.strokeStyle = "#FFFFFF"
        localColor = "#FFFFFF"
    }

    trash.onclick = function () {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        socket.emit("dropPicture")
    }
    //TODO: Find Way to not redraw
    socket.on("updateCanvas", AddSocketData)

    socket.on("sendCanvas", AddConnectionSocketData)

    socket.on("deletePicture", DeletePicture)


    canvas.onmousemove = function (e) {

        if (isDrawing) {

            AddMousePos(e.clientX - this.offsetLeft, e.clientY - this.offsetTop, isDrawing)
            LocalDraw()
        }
    }

    canvas.onmousedown = function (e) {

        isDrawing = true
        AddMousePos(e.clientX - this.offsetLeft, e.clientY - this.offsetTop, false)
        LocalDraw()
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
            ctx.closePath()
            ctx.stroke()
            localProgress++
        }
        ctx.strokeStyle = localColor
        ctx.save()
    }


    function UpdateDrawing(data) {
        for (let i = localProgress; i < data.mouseX.length; i++) {

            ctx.beginPath()

            if (data.mousedown[i] && i) ctx.moveTo(data.mouseX[i - 1], data.mouseY[i - 1])
            else ctx.moveTo(data.mouseX[i] - 1, data.mouseY[i])

            ctx.lineTo(data.mouseX[i], data.mouseY[i])
            ctx.strokeStyle = data.color[i]
            ctx.closePath()
            ctx.stroke()
            localProgress++
        }
        ctx.strokeStyle = localColor
        ctx.save()
    }


    function AddMousePos(clientX, clientY, isMouseDown) {

        if (prevX !== clientX || prevY !== clientY && clientX !== undefined) {
            let data = {
                clientX,
                clientY,
                isMouseDown,
                localProgress,
                color: ctx.strokeStyle
            }
            localData.mouseX.push(clientX)
            localData.mouseY.push(clientY)
            localData.mousedown.push(isMouseDown)
            localData.color.push(ctx.strokeStyle)
            socket.emit("drawing", data)
            prevX = clientX
            prevY = clientY
        }
    }


    function AddSocketData(data) {
        if (Object.keys(data).length) {
            localData.mouseX.push(data.clientX)
            localData.mouseY.push(data.clientY)
            localData.mousedown.push(data.isMouseDown)
            localData.color.push(data.color)
            LocalDraw()
        }
    }

    function AddConnectionSocketData(data) {
        if (Object.keys(data).length) {
            localData.mouseX.push(...data.mouseX)
            localData.mouseY.push(...data.mouseY)
            localData.mousedown.push(...data.mousedown)
            localData.color.push(...data.color)
            LocalDraw()
        }
    }


    function DeletePicture() {
        localProgress = 0
        localData = {
            mouseX: [],
            mouseY: [],
            mousedown: [],
            color: []
        }
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    }
}