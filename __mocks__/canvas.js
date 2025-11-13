// Mock canvas module for Jest tests
// This prevents native dependency issues in CI environments like Vercel
// where native modules cannot be built

const createMockContext = () => ({
  fillRect: () => {},
  clearRect: () => {},
  getImageData: () => ({ data: new Array(4) }),
  putImageData: () => {},
  createImageData: () => [],
  setTransform: () => {},
  drawImage: () => {},
  save: () => {},
  fillText: () => {},
  restore: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  stroke: () => {},
  translate: () => {},
  scale: () => {},
  rotate: () => {},
  arc: () => {},
  fill: () => {},
  measureText: () => ({ width: 0 }),
  transform: () => {},
  rect: () => {},
  clip: () => {},
})

const createMockCanvas = () => ({
  getContext: () => createMockContext(),
  toDataURL: () => '',
  width: 0,
  height: 0,
})

module.exports = {
  createCanvas: createMockCanvas,
  loadImage: () => Promise.resolve({}),
  Image: function() {},
}

