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
export class Sprite {
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
      if (this._src) {
        this._canvas.width = this._src.width;
        this._canvas.height = this._src.height;
      }
    }
    return this._canvas;
  }
  /*
   * @description 设置宽度（canvas）
   * @param {number} n
   */
  width(n) {
    try {
      this._canvas.width = +n || this._src.width || this._canvas.width;
    } catch (e) {}
  }
  /*
   * @description 设置高度（canvas）
   * @param {number} n
   */
  height(n) {
    try {
      this._canvas.height = +n || this._src.width || this._canvas.height;
    } catch (e) {}
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
    }
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
/*
 * 图片编辑器
 * 输入，输出，编辑，辅助
 */
export default class Editor {
  constructor() {
    this._state = {}; // 当前状态

    const _history = []; // 操作步骤（state）集合
    let _historyIndex = 0; // 操作步骤index

    Object.defineProperties(this, {
      _historyIndex: {
        set(val) {
          if (typeof val !== 'number') return;
          _historyIndex = Math.max(0, Math.min(_history.length - 1, val))
        },
        get() {
          return _historyIndex;
        }
      }
    })
  }
  /*
   * 设置拖拽元素
   */
  bindDragEl() {}
  /*
   * 设置file input
   */
  bindFileInput() {}
  /*
   * 上一步操作
   */
  prev() {
    this._historyIndex = this._historyIndex - 1;
  }
  /*
   * 下一步操作
   */
  next() {
    this._historyIndex = this._historyIndex + 1;
  }
  /*
   * 保存状态（清理history）
   */
  save() {
    const state = this._history[this._historyIndex];
    this._historyIndex = 0;
    if (state) {
      this._history.length = 0;
      this._history.push(state);
    }
  }
  /*
   * 恢复最初状态
   */
  reset() {
    this._history.length = 0;
  }
  /*
   * 预览
   */
  preview() {}
  /*
   * 视图缩放
   */
  resize() {}
  onChange() {}
}
// 辅助方法
/* 
 * 加载线上图片
 *
 * @param {string} url
 * @return {object} promise
 */
export const fetchImg = (url) => {
  return new Promise((resolve, reject) => {
    if (!url || typeof url !== 'string' || !/^(?:https?:)?\/\//i.test(url)) reject(0);
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = () => {
      const file = xhr.response;
      let name = '';
      const m = url.match(/[\w.-]+\.(?:jpe?g|png|gif|bmp)$/);
      if (m) name = m[0];
      else {
        name = Date.now();
        const ext = file.type.split('/')[1];
        switch (ext) {
          case 'jpeg':
            name = `${name}.jpg`;
            break;
          default:
            name = `${name}.${ext}`;
            break;
        }
      }
      file.name = name;
      resolve(file);
    }
    xhr.onerror = (e) => {
      console.error('fetchImg err', e);
      reject(e);
    }
    xhr.open('GET', url);
    // xhr.overrideMimeType('text/plain; charset=x-user-defined')
    xhr.send(null);
  })
}
/* 
 * 加载图片
 *
 * @param {string} src url/base64
 * @return {object} promise
 */
export function loadImg(src) {
  return new Promise((resolve, reject) => {
    if (!src || typeof src !== 'string' || !/^(?:data:image\/[^;]+;\s*base64\s*,|(?:https?:)?\/\/)/i.test(src)) {
      reject(0);
      return;
    }
    let img = new Image;
    img.crossOrigin = "anonymous";
    img.onload = function () {
      resolve(this);
      img = img.onload = img.onerror = null;
    }
    img.onerror = function (e) {
      console.error('loadImg error', e);
      img = img.onload = img.onerror = null;
      reject(e);
    }
    img.src = src;
  })
}
/* 
 * 图片转base64
 *
 * @param {blob} file
 * @return {object} promise
 */
export function readFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || typeof file !== 'object') reject(0);
    let fileReader = new FileReader;
    fileReader.onload = (e) => {
      resolve(e.target.result);
      fileReader = fileReader.onload = fileReader.onerror = null;
    }
    fileReader.onerror = (e) => {
      console.error('readFile error', e);
      fileReader = fileReader.onload = fileReader.onerror = null;
      reject(e);
    }
    fileReader.readAsDataURL(file);
  })
}
/* 
 * 上传图片预览
 *
 * @param {blob} file
 * @return {object} promise
 */
export const preview = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || typeof file !== 'object') reject(0);
    let img = new Image;
    img.onload = function () {
      URL.revokeObjectURL(this.src);
    }
    img.onerror = (e) => {
      reject(e);
    }
    img.src = URL.createObjectURL(file);
    resolve(img);
  })
}
export const resize = async (img, width, height) => {
  if (!width && !height) return false;
  if (typeof img === 'string' && /^(?:https?:)?\/\//.test(img)) {
    img = await fetchImg(img);
  }
  const mime = img.type;
  const edit = new ImgEdit();
  return edit.open(img).then(() => {
    const b64 = edit.resize(width, height).toDataURL(mime);
    edit.destroy();
    return b64;
  });
}
export const cut = async (img, width, height, x, y) => {
  if (!width && !height) return false;
  if (typeof img === 'string' && /^(?:https?:)?\/\//.test(img)) {
    img = await fetchImg(img);
  }
  const mime = img.type;
  const edit = new ImgEdit();
  return edit.open(img).then(() => {
    const b64 = edit.cut(width, height, x, y).toDataURL(mime);
    edit.destroy();
    return b64;
  });
}
export const rotate = async (img, deg) => {
  if (!deg) return false;
  if (typeof img === 'string' && /^(?:https?:)?\/\//.test(img)) {
    img = await fetchImg(img);
  }
  const mime = img.type;
  const edit = new ImgEdit();
  return edit.open(img).then(() => {
    const b64 = edit.rotate(deg).toDataURL(mime);
    edit.destroy();
    return b64;
  });
}