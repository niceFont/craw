window.onload = function () {

    const socket = io()
    const canvas = document.getElementById("myCanvas")
    const ctx = canvas.getContext("2d")

    let localProgress = 0
    let isDrawing = false
    let prevX = 0
    let prevY = 0

    ctx.strokeStyle = "#00000"
    ctx.lineJoin = "round"
    ctx.lineWidth = 3


    socket.on("updateCanvas", function (data) {
        if (Object.keys(data).length) UpdateDrawing(data)
    })
    
    canvas.onmousemove = function (e) {
        if (isDrawing) {
            addMousePos(e.clientX - 20, e.clientY - 54, true)
        }
    }

    canvas.onmousedown = function (e) {

        isDrawing = true
        addMousePos(e.clientX - 20, e.clientY - 54, false)
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
            ctx.closePath()
            ctx.stroke()
            localProgress++
        }

        ctx.save()
    }


    function addMousePos(clientX, clientY, isMouseDown) {
        if (prevX !== clientX || prevY !== clientY) {

            let data = {
                clientX,
                clientY,
                isMouseDown,
                localProgress
            }
            socket.emit("drawing", data)
            prevX = clientX
            prevY = clientY
        }
    }
}