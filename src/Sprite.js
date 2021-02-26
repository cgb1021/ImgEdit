/*
 * @description 获取HTMLElement
 * @param {string|HTMLElement} el
 * @return HTMLElement
 */
function querySelector(el) {
  if (typeof el !== 'object') {
    return /^\w+$/.test(el) ? document.getElementById(el) : document.querySelector(el);
  } else if (el instanceof HTMLElement) return el;
  return null;
}
/*
 * 图片资源
 */
export default class Sprite {
  constructor(src, canvas) {
    this._canvas = null; // canvas
    this._src = null;
    if (src) {
      this.src(src)
    }
    if (this._src || canvas) {
      this.canvas(canvas)
    }
  }
  _draw() {
    if (this._src && this._canvas) {
      const ctx = this._canvas.getContext('2d');
      ctx.drawImage(this._src, this._sx, this._sy, this._sw, this._sh, 0, 0);
    }
  }
  /*
   * @description 设置canvas
   * @param {undefined|string|canvas} el
   * @return {canvas|null}
   */
  canvas(el) {
    el = querySelector(el);
    if (el && 'getContext' in el) {
      this._canvas = el;
    }
    if (!this._canvas) {
      this._canvas = document.createElement('canvas');
      this.resize();
    }
    return this._canvas;
  }
  /*
   * @description 设置图像源（img，canvas）
   * @param {Image|canvas} el
   */
  src(src) {
    if (src instanceof Image || 'getContext' in src) {
      this._src = src
      this._sx = 0; // 图像源裁剪起点x轴位置
      this._sy = 0; // 图像源裁剪起点y轴位置
      this._angle = 0; // 旋转角度
      this._sw = src.width; // 图像源裁剪宽度
      this._sh = src.height; // 图像源裁剪高度
      this.resize();
    }
  }
  /*
   * @description 设置宽高（canvas）
   * @param {number} w
   * @param {number} h
   */
  resize(w, h) {
    try {
      this._canvas.width = +w || this._src.width || this._canvas.width;
      this._canvas.height = +h || this._src.height || this._canvas.height;
    } catch (e) {}
  }
  /*
   * @description 变形
   * @param {number} w
   * @param {number} h
   * @param {number} x
   * @param {number} y
   */
  scale() {}
  /*
   * @description 裁剪
   * @param {number} w
   * @param {number} h
   * @param {number} x
   * @param {number} y
   */
  cut(w, h, x = 0, y = 0) {}
  /*
   * @description 旋转
   * @param {number} angle
   */
  rotate(angle) {}
  /*
   * @description 输出图像为dataurl
   * @param {string} mime
   * @param {number} quality
   * @return {Promise}
   */
  toDataURL(mime = 'image/jpeg', quality = .8) {
  }
  /*
   * @description 输出图像为blob
   * @param {string} mime
   * @param {number} quality
   * @return {Promise}
   */
  toBlob(mime = 'image/jpeg', quality = .8) {
  }
}
