window.onload = function () {

    const socket = io()
    const canvas = document.getElementById("myCanvas")
    const ctx = canvas.getContext("2d")
    const buttons = document.getElementsByClassName("color-button")


    let localProgress = 0
    let localColor = ctx.strokeStyle
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

    socket.on("updateCanvas", function (data) {
        if (Object.keys(data).length) UpdateDrawing(data)
    })

    canvas.onmousemove = function (e) {
        if (isDrawing) {
            addMousePos(e.clientX - this.offsetLeft, e.clientY - this.offsetTop, true)
        }
    }

    canvas.onmousedown = function (e) {
        isDrawing = true
        addMousePos(e.clientX - this.offsetLeft, e.clientY - this.offsetTop, false)
    }

    canvas.onmouseup = function (e) {
        isDrawing = false
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


    function addMousePos(clientX, clientY, isMouseDown) {
        if (prevX !== clientX || prevY !== clientY) {

            let data = {
                clientX,
                clientY,
                isMouseDown,
                localProgress,
                color: ctx.strokeStyle
            }
            socket.emit("drawing", data)
            prevX = clientX
            prevY = clientY
        }
    }
}