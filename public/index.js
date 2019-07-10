window.onload = function () {

    const socket = io({ transports: ["websocket", 'flashsocket', 'xhr-polling', 'jsonp-polling'] })
    const canvas = document.getElementById("myCanvas")
    const ctx = canvas.getContext("2d")
    const buttons = document.getElementsByClassName("color-button")
    const eraser = document.getElementById("eraser")
    const trash = document.getElementById("trash")
    const slider = document.getElementById("mySlider")
    const sliderCount = document.getElementById("sliderCount")
    const colorPicker = document.getElementById("colorPicker")


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
    let localSize = 10
    let canvasMap = new Map()
    let lastPointMap = new Map()

    ctx.strokeStyle = "#00000"
    ctx.lineJoin = "round"
    ctx.lineWidth = 10
    sliderCount.innerHTML = 10

    Array.prototype.forEach.call(buttons, element => {
        element.onclick = function (e) {
            let color = window.getComputedStyle(element).getPropertyValue("background-color")
            ctx.strokeStyle = color
            localColor = color
        }
    })

    socket.on("addUser", GenerateCanvas)

    socket.on("assignUsername", (userID) => {
        if (userID) {
            localUsername = userID
            console.log("Connected as User: " + userID)
            GenerateCanvas(userID)
            return
        }

        console.error("Problem fetching UserID due to server restart. (Reload may be needed)")

    })

    socket.on("updateCanvas", DispatchActions)

    socket.on("renderConnectionCanvas", RenderCanvas)

    socket.on("deletePicture", DeletePicture)


    eraser.onclick = function () {
        ctx.strokeStyle = "#FFFFFF"
        localColor = "#FFFFFF"
    }

    trash.onclick = function () {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        socket.emit("dropPicture")
    }

    colorPicker.oninput = function (e) {
        ctx.strokeStyle = e.target.value
        localColor = e.target.value
        return
    }

    colorPicker.onclick = function (e) {
        return
    }


    colorPicker.onpage

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

        }
        ctx.strokeStyle = localColor
        ctx.lineWidth = localSize
        ctx.save()
    }

    function RenderCanvas(data) {

        let tempX, tempY
        let tempPoints = {}
        for (let i = 0; i < data.mouseX.length; i++) {

            let localCanvas = SearchCanvasByID(data.users[i])
            let localCtx
            if (localCanvas || typeof localCanvas !== "undefined") localCtx = localCanvas.getContext("2d")
            else {
                localCanvas = GenerateCanvas(data.users[i])
                localCtx = localCanvas.getContext("2d")
            }
            localCtx.lineJoin = "round"
            localCtx.beginPath()

            if (data.mousedown[i] && i) {
                localCtx.moveTo(tempX, tempY)
                if (tempPoints[data.users[i]]) {
                    tempX = tempPoints[data.users[i]].PointX
                    tempY = tempPoints[data.users[i]].PointY
                }
            } else {
                tempX = data.mouseX[i]
                tempY = data.mouseY[i]
                localCtx.moveTo(data.mouseX[i] - 1, data.mouseY[i])
            }
            localCtx.lineTo(data.mouseX[i], data.mouseY[i])
            localCtx.strokeStyle = data.color[i]
            localCtx.lineWidth = data.sizes[i]
            localCtx.closePath()
            localCtx.stroke()
            tempPoints[data.users[i]] = { PointX: data.mouseX[i], PointY: data.mouseY[i] }
        }

    }


    function UpdateDrawingByID(data, userID) {
        let localCtx
        let localCanvas = SearchCanvasByID(userID)

        let tempX, tempY
        if (lastPointMap.has(userID)) {
            let lastPoint = lastPointMap.get(userID)
            tempX = lastPoint.mouseX
            tempY = lastPoint.mouseY
        }

        if (localCanvas) {
            localCtx = localCanvas.getContext("2d")
        } else {
            let genCanvas = GenerateCanvas(userID)
            localCtx = genCanvas.getContext("2d")
        }

        localCtx.lineJoin = "round"
        localCtx.beginPath()

        if (data.isMouseDown && serverProgress) {
            localCtx.moveTo(tempX, tempY)
        } else {
            tempX = data.clientX
            tempY = data.clientY
            localCtx.moveTo(data.clientX - 1, data.clientY)
        }
        localCtx.lineTo(data.clientX, data.clientY)
        localCtx.strokeStyle = data.color
        localCtx.lineWidth = data.size
        localCtx.closePath()
        localCtx.stroke()
        serverProgress++
        lastPointMap.set(userID, {
            mouseX: data.clientX,
            mouseY: data.clientY
        })
    }

    function AddMousePos(clientX, clientY, isMouseDown) {

        if (prevX !== clientX || prevY !== clientY && clientX !== undefined) {
            let data = {
                clientX,
                clientY,
                isMouseDown,
                color: ctx.strokeStyle,
                size: ctx.lineWidth,
                username: localUsername,
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



    function GenerateCanvas(canvasID) {
        if (!canvasID) {
            console.error("CanvasID Missing")
            return
        }
        let newCanvas = document.createElement("canvas")
        newCanvas.className = canvasID
        let container = document.getElementById("canvas-container")
        container.appendChild(newCanvas)
        newCanvas.width = 800
        newCanvas.height = 600

        canvasMap.set(canvasID, newCanvas)

        return newCanvas
    }



    function SearchCanvasByID(userID) {
        if (!userID || typeof userID === "undefined") return null
        let foundCanvas = document.getElementsByClassName(userID)
        if (!foundCanvas.length) return null
        else return foundCanvas[0]
    }

    function DispatchActions(data) {
        if (Object.keys(data).length) {
            UpdateDrawingByID(data, data.username)
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

        let canvases = document.querySelectorAll("canvas")
        for (let canvas of canvases) {
            canvas.getContext("2d").clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        }


        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    }


}