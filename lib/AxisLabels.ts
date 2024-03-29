import { ContainerType } from './Container'
import { DataRange } from './DataRange'
import { createOrGates } from './utils'

// pixels dom space
const Y_OFFSET = -2
const FONT_SIZE = 12
const BORDER_STROKE = 21

let stylesSetup = false
const setupStyles = () => {
  if (stylesSetup) return
  stylesSetup = true
  const style = document.createElement('style')

  // background-color: inherit;

  style.innerHTML = `
      .tfeditor-svg-axis-label {
        color: black;
        position: absolute;
        background-color: white;
        border-style: solid;
        border-color: black;
        border-width: 1px;
        font-size: ${FONT_SIZE}px;
        padding: 2px 6px;
        box-sizing: border-box;
        transition: opacity 0.1s ease-in-out;
      }
    `
  document.head.appendChild(style)
}

export const AxisLabels = (container: ContainerType, dataRange: DataRange) => {
  const { appendChild, addSizeObserver, paddedBorder } = container

  setupStyles()
  const createLabel = () => {
    const foreignObject = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'foreignObject',
    )
    foreignObject.setAttribute('width', '100%')
    foreignObject.setAttribute('height', '100%')
    foreignObject.setAttribute('pointer-events', 'none')

    const label = document.createElementNS(
      'http://www.w3.org/1999/xhtml',
      'div',
    )
    label.setAttribute('class', 'tfeditor-svg-axis-label')
    foreignObject.appendChild(label)
    appendChild(foreignObject, 'overlay')
    return label
  }
  const low = createLabel()
  const high = createLabel()

  const invisibleHoverBorder = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'rect',
  )
  appendChild(invisibleHoverBorder)
  invisibleHoverBorder.setAttribute('fill', 'none')
  invisibleHoverBorder.setAttribute('stroke', 'none')
  invisibleHoverBorder.setAttribute('stroke-width', String(BORDER_STROKE))
  invisibleHoverBorder.setAttribute('pointer-events', 'stroke')

  const getSvgPosition = (xNormalized: number) => {
    const [xSvg, bottom] = container.normalizedToSvg(xNormalized, 0)
    const ySvg = bottom + Y_OFFSET + FONT_SIZE
    return [xSvg, ySvg]
  }

  const updateLabel = (
    label: HTMLElement,
    xNormalized: number,
    align: 'start' | 'end',
  ) => {
    const value = dataRange.toDataSpace(xNormalized)
    label.textContent = value === 0 ? '0' : `${value.toPrecision(4)}`
    const [x, y] = getSvgPosition(xNormalized)

    const box = label.getBoundingClientRect()
    const xOffset = align === 'start' ? -0.5 : -box.width + 0.5
    const yOffset = box.height / 2
    label.style.transform = `translate(${x + xOffset}px,${y - yOffset}px)`

    // match padded border attributes to invisible hover border
    ;['x', 'y', 'width', 'height'].forEach((attr) => {
      const value = paddedBorder.getAttribute(attr)
      value !== null && invisibleHoverBorder.setAttribute(attr, value)
    })
  }

  const updateLabels = () => {
    const [lowX, highX] = container.getViewBox()
    updateLabel(low, lowX, 'start')
    updateLabel(high, highX, 'end')
  }

  updateLabels()
  addSizeObserver(updateLabels)
  dataRange.eventTarget.addEventListener('updated', updateLabels)

  const setVisibility = (visibility: boolean) => {
    const opacity = visibility ? '1' : '0'
    low.style.opacity = opacity
    high.style.opacity = opacity
  }

  const createSetVisibilityGate = createOrGates(setVisibility)

  const setVisFromBorder = createSetVisibilityGate()
  invisibleHoverBorder.addEventListener('pointerenter', () => {
    setVisFromBorder(true)
  })
  invisibleHoverBorder.addEventListener('pointerleave', () => {
    setVisFromBorder(false)
  })

  return { createSetVisibilityGate }
}
