import { throttle } from '@kitware/vtk.js/macros'
import {
  TransferFunctionEditor,
  windowPointsForSort,
} from '../../lib/TransferFunctionEditor'

const PIECEWISE_UPDATE_DELAY = 100

const getNodes = (range, points) => {
  const delta = range[1] - range[0]
  const windowedPoints = windowPointsForSort(points)
  return windowedPoints.map(([x, y]) => ({
    x: range[0] + delta * x,
    y,
    midpoint: 0.5,
    sharpness: 0,
  }))
}

// grab head and tail or fallback to data range if 1 or less points
const getRange = (nodes, dataRange) =>
  nodes.length > 1 ? [nodes[0].x, nodes[nodes.length - 1].x] : dataRange

const updateContextPiecewiseFunction = (context, dataRange, points) => {
  const name = context.images.selectedName
  const actorContext = context.images.actorContext.get(name)
  const component = actorContext.selectedComponent
  const nodes = getNodes(dataRange, points)
  const range = getRange(nodes, dataRange)
  context.service.send({
    type: 'IMAGE_PIECEWISE_FUNCTION_CHANGED',
    data: {
      name,
      component,
      range,
      nodes,
    },
  })
}

const noop = () => undefined
const vtkPiecewiseGaussianWidgetFacade = (tfEditor, context) => {
  let dataRange = [0, 255]

  const update = () =>
    updateContextPiecewiseFunction(context, dataRange, tfEditor.getPoints())

  const throttledUpdate = throttle(update, PIECEWISE_UPDATE_DELAY)
  tfEditor.eventTarget.addEventListener('updated', throttledUpdate)

  const getOpacityNodes = () => getNodes(dataRange, tfEditor.getPoints())

  // to compare changes across setting the data view range
  let cachedGaussian

  return {
    setColorTransferFunction: (tf) => {
      tfEditor.setColorTransferFunction(tf)
    },

    render: noop,

    getGaussians() {
      const xPositions = tfEditor.getPoints().map(([x]) => x)
      const min = Math.min(...xPositions)
      const width = (Math.max(...xPositions) - min) / 2
      const position = min + width
      const height = Math.max(...tfEditor.getPoints().map(([, y]) => y))

      return [{ width, position, height }]
    },

    setGaussians(gaussians) {
      const newG = gaussians[0]
      const oldG = cachedGaussian ?? this.getGaussians()[0]
      const heightDelta = newG.height - oldG.height

      const newMin = newG.position - newG.width
      const newRange = 2 * newG.width

      const pointsGaussian = this.getGaussians()[0]
      const pointsMin = pointsGaussian.position - pointsGaussian.width
      const points = tfEditor
        .getPoints()
        // compute x in "gaussian"
        .map(([x, y]) => [(x - pointsMin) / (pointsGaussian.width * 2), y])
        .map(([x, y]) => {
          return [x * newRange + newMin, y + y * heightDelta]
        })

      tfEditor.setPoints(points)

      cachedGaussian = { ...newG }

      update()
    },

    setRangeZoom: (newRange) => {
      tfEditor.setViewBox(...newRange)
    },
    setDataRange: (newRange) => {
      dataRange = [...newRange]
    },

    getOpacityNodes,
    getOpacityRange: () => getRange(getOpacityNodes(), dataRange),
    setHistogram: (h) => tfEditor.setHistogram(h),
  }
}

export const createTransferFunctionEditor = (context, mount) => {
  const editor = new TransferFunctionEditor(mount)

  return vtkPiecewiseGaussianWidgetFacade(editor, context)
}
