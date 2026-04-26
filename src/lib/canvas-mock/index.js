'use strict'

// Minimal mock of @napi-rs/canvas so pdfjs-dist can load its
// DOMMatrix/ImageData/Path2D references without crashing in serverless Node.js.
// Text extraction never invokes rendering APIs, so stub implementations suffice.

class DOMMatrix {
  constructor(init) {
    this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0
    this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0
    this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0
    this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0
    this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1
    this.is2D = true; this.isIdentity = true
    if (Array.isArray(init) && init.length === 6) {
      [this.a, this.b, this.c, this.d, this.e, this.f] = init
    }
  }
  multiply() { return new DOMMatrix() }
  inverse() { return new DOMMatrix() }
  translate(tx, ty) { const m = new DOMMatrix([this.a,this.b,this.c,this.d,this.e+tx,this.f+ty]); return m }
  scale() { return new DOMMatrix() }
  rotate() { return new DOMMatrix() }
  skewX() { return new DOMMatrix() }
  skewY() { return new DOMMatrix() }
  transformPoint(p) { return p ?? { x: 0, y: 0 } }
  toFloat32Array() { return new Float32Array([this.a,this.b,this.c,this.d,this.e,this.f]) }
  toFloat64Array() { return new Float64Array([this.a,this.b,this.c,this.d,this.e,this.f]) }
  toString() { return `matrix(${this.a},${this.b},${this.c},${this.d},${this.e},${this.f})` }
}

class ImageData {
  constructor(dataOrWidth, height, settings) {
    if (typeof dataOrWidth === 'number') {
      this.width = dataOrWidth
      this.height = height || 1
    } else {
      this.data = dataOrWidth
      this.width = height || 1
      this.height = settings?.height || 1
    }
    this.data = this.data || new Uint8ClampedArray(this.width * this.height * 4)
    this.colorSpace = 'srgb'
  }
}

class Path2D {
  constructor() {}
  moveTo() {}
  lineTo() {}
  closePath() {}
  arc() {}
  arcTo() {}
  rect() {}
  ellipse() {}
  bezierCurveTo() {}
  quadraticCurveTo() {}
  addPath() {}
}

class CanvasGradient {
  addColorStop() {}
}

class CanvasPattern {}

class CanvasRenderingContext2D {
  constructor() {
    this.fillStyle = '#000'
    this.strokeStyle = '#000'
    this.lineWidth = 1
    this.font = '10px sans-serif'
    this.textAlign = 'start'
    this.textBaseline = 'alphabetic'
    this.globalAlpha = 1
    this.globalCompositeOperation = 'source-over'
    this.imageSmoothingEnabled = true
    this.shadowColor = 'transparent'
    this.shadowBlur = 0
    this.shadowOffsetX = 0
    this.shadowOffsetY = 0
    this.lineCap = 'butt'
    this.lineJoin = 'miter'
    this.miterLimit = 10
    this.lineDashOffset = 0
    this.canvas = { width: 0, height: 0 }
    this.currentTransform = new DOMMatrix()
  }
  save() {}
  restore() {}
  scale() {}
  rotate() {}
  translate() {}
  transform() {}
  setTransform() {}
  resetTransform() {}
  getTransform() { return new DOMMatrix() }
  fillRect() {}
  strokeRect() {}
  clearRect() {}
  fillText() {}
  strokeText() {}
  measureText() { return { width: 0, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0, actualBoundingBoxLeft: 0, actualBoundingBoxRight: 0, fontBoundingBoxAscent: 0, fontBoundingBoxDescent: 0 } }
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  arcTo() {}
  rect() {}
  ellipse() {}
  bezierCurveTo() {}
  quadraticCurveTo() {}
  fill() {}
  stroke() {}
  clip() {}
  isPointInPath() { return false }
  isPointInStroke() { return false }
  createLinearGradient() { return new CanvasGradient() }
  createRadialGradient() { return new CanvasGradient() }
  createConicGradient() { return new CanvasGradient() }
  createPattern() { return new CanvasPattern() }
  drawImage() {}
  createImageData(w, h) { return new ImageData(w, h) }
  getImageData(x, y, w, h) { return new ImageData(w, h) }
  putImageData() {}
  setLineDash() {}
  getLineDash() { return [] }
  drawFocusIfNeeded() {}
}

class Canvas {
  constructor(width, height) {
    this.width = width || 0
    this.height = height || 0
    this.type = 'pdf'
  }
  getContext(type) {
    if (type === '2d') return new CanvasRenderingContext2D()
    return null
  }
  toDataURL() { return '' }
  toBuffer() { return Buffer.alloc(0) }
  toDataURLAsync() { return Promise.resolve('') }
  toBufferAsync() { return Promise.resolve(Buffer.alloc(0)) }
  get [Symbol.toStringTag]() { return 'Canvas' }
}

function createCanvas(width, height) {
  return new Canvas(width, height)
}

async function loadImage() {
  return { width: 0, height: 0, complete: true }
}

module.exports = {
  Canvas,
  CanvasRenderingContext2D,
  CanvasGradient,
  CanvasPattern,
  DOMMatrix,
  ImageData,
  Path2D,
  createCanvas,
  loadImage,
}
