import {CSSProperties, FC, useEffect, useRef} from 'react'

const TintedImage: FC<{
    src: string,
    color: string,
    style: CSSProperties,
}> = ({src, color, style}) => {

    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {(async () => {
        const image = new Image()
        image.src = src
        await image.decode()

        const canvas = canvasRef.current as HTMLCanvasElement
        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight
        const context = canvas.getContext('2d') as CanvasRenderingContext2D

        context.clearRect(0, 0, canvas.width, canvas.height)

        context.globalCompositeOperation = 'source-over'
        context.fillStyle = color
        context.fillRect(0, 0, canvas.width, canvas.height)

        context.globalCompositeOperation = 'destination-in'
        context.drawImage(image, 0, 0)
    })()}, [src, color])

    return <canvas style={style} ref={canvasRef}/>
}

export default TintedImage
