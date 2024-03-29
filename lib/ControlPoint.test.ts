import { describe, expect, beforeEach, it } from 'vitest'
import { makeTestableContainer } from './Container.test'
import { ControlPoint } from './ControlPoint'
import { Point } from './Point'

describe('ControlPoint', () => {
  let controlPoint: ControlPoint, point: Point

  beforeEach(() => {
    const { container } = makeTestableContainer()
    point = new Point(0, 0)
    controlPoint = new ControlPoint(container, point, (x) => x)
  })

  it('Clicking and dragging moves the model point', () => {
    const pointerDown = new PointerEvent('pointerdown', { bubbles: true })

    controlPoint.element.dispatchEvent(pointerDown)

    const pointerMove = new PointerEvent('pointermove', {
      bubbles: true,
      clientX: 150,
    })
    document.dispatchEvent(pointerMove)

    const pointerUp = new PointerEvent('pointerup', { bubbles: true })
    document.dispatchEvent(pointerUp)

    expect(point.x).not.toBe(0)
  })

  it('Fires delete event when clicking ControlPoint without moving', () => {
    let shouldDelete = false
    const cb = () => (shouldDelete = true)
    controlPoint.eventTarget.addEventListener(controlPoint.DELETE_EVENT, cb)

    const pointerDown = new PointerEvent('pointerdown', { bubbles: true })
    controlPoint.element.dispatchEvent(pointerDown)

    const pointerUp = new PointerEvent('pointerup', { bubbles: true })
    document.dispatchEvent(pointerUp)

    expect(shouldDelete).toBe(true)
  })

  it('Clicking ControlPoint, moving, then pointer up does not fire delete event', () => {
    let shouldDelete = false
    const cb = () => (shouldDelete = true)
    controlPoint.eventTarget.addEventListener(controlPoint.DELETE_EVENT, cb)

    const pointerDown = new PointerEvent('pointerdown', { bubbles: true })
    controlPoint.element.dispatchEvent(pointerDown)

    const pointerMove = new PointerEvent('pointermove', {
      bubbles: true,
      clientX: 10,
    })
    document.dispatchEvent(pointerMove)

    const pointerUp = new PointerEvent('pointerup', { bubbles: true })
    document.dispatchEvent(pointerUp)

    expect(shouldDelete).toBe(false)
  })
})
