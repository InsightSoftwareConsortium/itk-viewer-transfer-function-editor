import { windowPoints } from './Points'

export function rescaleArray(array: number[], focusArea: [number, number]) {
  if (!focusArea) {
    return array
  }
  const maxIdx = array.length - 1
  const idxRange = focusArea.map((v) => Math.round(v * maxIdx))
  return array.slice(idxRange[0], idxRange[1] + 1)
}

export type ChartStyle = {
  lineWidth: number
  strokeStyle: string
  fillStyle?: string | CanvasGradient | CanvasPattern | undefined
  clip?: boolean
}

export const drawChart = (
  ctx: CanvasRenderingContext2D,
  area: [number, number, number, number],
  values: number[],
  style: ChartStyle = {
    lineWidth: 1,
    strokeStyle: '#000',
    fillStyle: undefined,
    clip: false,
  }
) => {
  const verticalScale = area[3]
  const horizontalScale = area[2] / (values.length - 1)
  const offset = verticalScale + area[1]

  ctx.lineWidth = style.lineWidth
  ctx.strokeStyle = style.strokeStyle

  ctx.beginPath()
  ctx.moveTo(area[0], area[1] + area[3])

  for (let index = 0; index < values.length; index++) {
    ctx.lineTo(
      area[0] + index * horizontalScale,
      Math.max(area[1], offset - values[index] * verticalScale)
    )
  }

  if (style.fillStyle) {
    ctx.fillStyle = style.fillStyle
    ctx.lineTo(area[0] + area[2], area[1] + area[3])

    if (style.clip) {
      ctx.clip()
      return
    }

    ctx.fill()
  }
  ctx.stroke()
}

export type ColorTransferFunction = {
  getUint8Table: (
    start: number,
    end: number,
    width: number,
    withAlpha: boolean
  ) => Uint8Array
  getMappingRange: () => [number, number]
}

const CANVAS_HEIGHT = 1

export const updateColorCanvas = (
  colorTransferFunction: ColorTransferFunction,
  width: number,
  canvas: HTMLCanvasElement
) => {
  const workCanvas = canvas || document.createElement('canvas')
  workCanvas.setAttribute('width', String(width))
  workCanvas.setAttribute('height', String(CANVAS_HEIGHT))

  const [startValue, endValue] = colorTransferFunction.getMappingRange()
  const rgba = colorTransferFunction.getUint8Table(
    startValue,
    endValue,
    width,
    true
  )

  const ctx = workCanvas.getContext('2d')
  if (ctx) {
    const pixelsArea = ctx.getImageData(0, 0, width, CANVAS_HEIGHT)
    for (let lineIdx = 0; lineIdx < CANVAS_HEIGHT; lineIdx++) {
      pixelsArea.data.set(rgba, lineIdx * 4 * width)
    }

    const nbValues = CANVAS_HEIGHT * width * 4
    // const lineSize = width * 4
    for (let i = 3; i < nbValues; i += 4) {
      pixelsArea.data[i] = 255 // keep full opacity at bottom rather than: 255 - Math.floor(i / lineSize)
    }

    ctx.putImageData(pixelsArea, 0, 0)
  }

  return workCanvas
}

export const windowPointsForSort = (points: [number, number][]) => {
  const windowedPoints = windowPoints(points)
  // avoid unstable Array.sort issues
  windowedPoints[0][0] -= 1e-8
  windowedPoints[windowedPoints.length - 1][0] += 1e-8
  return windowedPoints
}
