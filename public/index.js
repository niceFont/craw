window.onload = function () {

    const socket = io()
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
        localUsername = userID
        GenerateCanvas(userID)
    })

    socket.on("updateCanvas", DispatchActions)

    socket.on("sendCanvas", DispatchActions)

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



    async function UpdateDrawingByID(data, userID) {
        let localCtx
        let localCanvas = SearchCanvasByID(userID)
        let tempData = {
            mouseX: [],
            mouseY: [],
            mousedown: [],
            color: [],
            sizes: []
        }

        let tempX, tempY
        if (lastPointMap.has(userID)) {
            let lastPoint = lastPointMap.get(userID)

            tempX = lastPoint.mouseX
            tempY = lastPoint.mouseY
        }
        for (let index = serverProgress; index < data.mouseX.length; index++) {

            if (userID === data.users[index]) {
                tempData.mouseX.push(data.mouseX[index])
                tempData.mouseY.push(data.mouseY[index])
                tempData.mousedown.push(data.mousedown[index])
                tempData.sizes.push(data.sizes[index])
                tempData.color.push(data.color[index])
            }
        }
        if (localCanvas) {
            localCtx = localCanvas.getContext("2d")
        } else {
            let genCanvas = GenerateCanvas(userID)
            localCtx = genCanvas.getContext("2d")
        }
        localCtx.lineJoin = "round"
        for (let i = 0; i < tempData.mouseX.length; i++) {
            localCtx.beginPath()

            if (tempData.mousedown[i] && serverProgress) {
                localCtx.moveTo(tempX, tempY)
                if (lastPointMap.has(userID)) {
                    let lastPoint = lastPointMap.get(userID)

                    tempX = lastPoint.mouseX
                    tempY = lastPoint.mouseY
                }
            } else {
                tempX = tempData.mouseX[i]
                tempY = tempData.mouseY[i]
                localCtx.moveTo(tempData.mouseX[i] - 1, tempData.mouseY[i])
            }
            localCtx.lineTo(tempData.mouseX[i], tempData.mouseY[i])
            localCtx.strokeStyle = tempData.color[i]
            localCtx.lineWidth = tempData.sizes[i]
            localCtx.closePath()
            localCtx.stroke()
            serverProgress++
            lastPointMap.set(userID, {
                mouseX: tempData.mouseX[i],
                mouseY: tempData.mouseY[i]
            })

        }
        socket.emit("lastPointBackUp", {
            lastPoints: lastPointMap
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



    /*    function IsCanvasEmpty(canvas) {
           if (!canvas) return false
           const ctx = canvas.getContext("2d")
           const buffer = new Uint32Array(ctx.getImageData(0, 0, 800, 600).data.buffer)
           return !buffer.some(pixel => pixel !== 0)
       }
    */
    function GenerateCanvas(canvasID) {
        if (!canvasID) {
            console.error("CanvasID Missing")
            return
        }
        let newCanvas = document.createElement("canvas")
        newCanvas.className = localUsername
        let container = document.getElementById("canvas-container")
        container.appendChild(newCanvas)
        newCanvas.width = 800
        newCanvas.height = 600

        canvasMap.set(canvasID, newCanvas)

        return newCanvas
    }

    function SearchCanvasByID(userID) {
        foundCanvas = document.getElementsByClassName(userID)
        if (!foundCanvas.length) return null
        else return foundCanvas[0]
    }

    async function DispatchActions(data) {
        if (Object.keys(data).length) {
            let prevUser = null
            console.time("dispatch")

            for (let index = serverProgress; index < data.mouseX.length; index++) {

                if (data.users[index] !== localUsername) {
                    UpdateDrawingByID(data, data.users[index])
                }
            }

            console.timeEnd("dispatch")
        }
    }

    /* function CacheResult(fn) {
        let cache = {}
        return function () {
            let args = arguments[0].className
            cache[args] = cache[args] || fn.apply(this, arguments)
            return cache[args]
        }
    } */

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

        canvasMap.forEach((canvas) => {
            canvas.getContext("2d").clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

        })

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    }


}