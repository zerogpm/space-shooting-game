/**
 * Creates a mock CanvasRenderingContext2D for testing entity classes
 * without a real canvas. All drawing methods are no-ops.
 */
export function createMockContext() {
  return {
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    save: () => {},
    restore: () => {},
    fillRect: () => {},
    fillText: () => {},
    fillStyle: '',
    globalAlpha: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
  }
}
