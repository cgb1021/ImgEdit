/*
 * 图片编辑器（图片编辑而不是图片合成）
 */
// const undefined = void 0;
const data = {};
const eventData = {
  active: false, // 点击事件开始标记
  offsetX: 0, // 点击事件开始x轴位置
  offsetY: 0 // 点击事件开始y轴位置
};
const eventNames = ['mousewheel', 'mousedown', 'mouseup', 'mouseout', 'mousemove'];
let ctrlKey = false; // ctrl键按下标记
// 移动事件
function moveEvent(e) {
  e.preventDefault();
  e.stopPropagation();
  const state = data[this.id];
  const sprite = state.sprite;
  if (!sprite) return;
  const { cx, cy } = sprite;
  const { width: iw, height: ih } = sprite.getViewSize(state.viewScale)
  switch (e.type) {
    case 'mousedown':
      ctrlKey = e.ctrlKey;
      if (!ctrlKey) {
        if (e.offsetX > cx && e.offsetY > cy && e.offsetX < cx + iw && e.offsetY < cy + ih) {
          // 在图片范围内
          eventData.active = true;
          eventData.offsetX = e.offsetX - cx;
          eventData.offsetY = e.offsetY - cy;
          this.canvas.style.cursor = 'move';
        }
      } else {
        // 按下ctrl键
        eventData.active = true;
        eventData.offsetX = e.offsetX;
        eventData.offsetY = e.offsetY;
      }
      break;
    case 'mouseout':
    case 'mouseup':
      if (eventData.active) {
        this.canvas.style.cursor = 'default';
        eventData.active = false;
      }
      break;
    case 'mousemove':
      if (eventData.active) {
        if (ctrlKey) {
          let x = Math.max(cx, Math.min(e.offsetX, eventData.offsetX));
          let y = Math.max(cy, Math.min(e.offsetY, eventData.offsetY));
          let width = Math.min(cx + iw, Math.max(e.offsetX, eventData.offsetX)) - x;
          let height = Math.min(cy + ih, Math.max(e.offsetY, eventData.offsetY)) - y;
          if (x + width > cx && y + height > cy && x < cx + iw && y < cy + ih) {
            x -= cx;
            y -= cy;
            // 裁剪只和原图有关，不用*scale
            Object.assign(state.range, { width: (width / state.viewScale) >> 0, height: (height / state.viewScale) >> 0, x: (x / state.viewScale) >> 0, y: (y / state.viewScale) >> 0 });
            stateChange(state, 'range');
          }
        } else {
          sprite.cx = e.offsetX - eventData.offsetX;
          sprite.cy = e.offsetY - eventData.offsetY;
        }
        draw(this.canvas, state);
      }
      break;
    case 'mousewheel':
      const direct = e.wheelDelta ?
        (e.wheelDelta > 0 ?
        0 :
        1) :
        (e.detail > 0 ?
        0 :
        1); // 0 上(缩小，scale变小) 1 下(放大，scale变大)
      eventData.offsetX = e.offsetX;
      eventData.offsetY = e.offsetY;
      this.scale(state.viewScale + (direct ? 0.1 : -0.1), 1);
      break;
  }
}
function stateChange (state, type) {
  if (state.onChange) {
    const range = Object.assign({}, state.range);
    const { width, height } = state.sprite.getSize();
    state.onChange({ width: width >> 0, height: height >> 0, scale: window.parseFloat(state.viewScale.toFixed(2)), range, type });
  }
}
/* 
 * 画矩形选择框
 */
function drawRect (context, state) {
  const { cx, cy } = state.sprite;
  let { x, y, width, height } = state.range;
  if (width && height) {
    const ratio = state.viewScale;
    context.setLineDash([5, 2]);
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.strokeRect(cx + x * ratio, cy + y * ratio, width * ratio, height * ratio);
  }
}
/* 
 * 画图
 *
 * @param {string} img
 * @param {object} canvas
 */
function draw (canvas, state) {
  // if (!canvas) return;
  const context = canvas.getContext('2d');
  const sprite = state.sprite;
  context.clearRect(0, 0, canvas.width, canvas.height);
  // 画背景
  state.before && state.before(context);
  // 画图片
  if (sprite) {
    sprite.draw(context, state.viewScale);
    /*绘制图片结束*/
    // 画矩形选择框
    if (state.range.width && state.range.height) {
      drawRect(context, state);
    }
  }
  state.after && state.after(context);
}
function save (state, method, ...args) {
  const canvas = document.createElement("canvas");
  // if (typeof canvas[method] !== 'function') return false;
  const ctx = canvas.getContext("2d");
  const sprite = state.sprite;
  const { x, y, width, height } = sprite;
  const { width: dWidth, height: dHeight } = sprite.getSize();
  canvas.width = dWidth;
  canvas.height = dHeight;
  if (sprite.angle) {
    if (sprite.angle !== 1) {
      // state.angle = .5, 1.5
      [canvas.width, canvas.height] = [canvas.height, canvas.width];
    }
    ctx.rotate(window.Math.PI * sprite.angle);
    switch (sprite.angle) {
      case .5:
        ctx.translate(0, -canvas.width);
        break;
      case 1.5:
        ctx.translate(-canvas.height, 0);
        break;
      default:
        ctx.translate(-canvas.width, -canvas.height);
    }
  }
  ctx.drawImage(sprite.img, x, y, width, height, 0, 0, dWidth, dHeight);
  return canvas[method](...args);
}
class Sprite {
  constructor (img) {
    this.img = img;
    this.init();
  }
  init () {
    this.width = this.img.width; // 图片显示范围宽度（cut）
    this.height = this.img.height; // 图片显示范围高度（cut）
    this.x = 0; // 图片显示范围x轴位置（cut）
    this.y = 0; // 图片显示范围y轴位置（cut）
    this.scale = 1; // 调整高宽时和原图比例（resize）
    this.angle = 0; // 旋转角度（rotate）
    this.cx = 0; // 图片在画布上x轴位置
    this.cy = 0; // 图片在画布上y轴位置
    this.zIndex = 0; // 图层深度（越大图层越高）
  }
  getSize () {
    const [width, height] = this.angle === .5 || this.angle === 1.5 ? [this.height * this.scale, this.width * this.scale] : [this.width * this.scale, this.height * this.scale];
    return {
      width,
      height
    };
  }
  getViewSize (viewScale) {
    const ratio = viewScale * this.scale;
    const [width, height] = this.angle === .5 || this.angle === 1.5 ? [this.height * ratio, this.width * ratio] : [this.width * ratio, this.height * ratio];
    return {
      width,
      height,
      ratio
    };
  }
  draw (context, viewScale) {
    // 坐标转换
    const canvas = context.canvas;
    const ratio = viewScale * this.scale;
    const width = this.width * ratio;
    const height = this.height * ratio;
    let cx, cy;
    switch (this.angle) {
      case 0.5: // 顺时针90°
        cx = this.cy;
        cy = canvas.width - this.cx - height;
        break;
      case 1.5: // 逆时针90°
        cx = canvas.height - this.cy - width;
        cy = this.cx;
        break;
      case 1: // 180°
        cx = canvas.width - this.cx - width;
        cy = canvas.height - this.cy - height;
        break;
      default: // 0°
        cx = this.cx;
        cy = this.cy;
    }
    // 变换坐标轴
    context.save();
    if (this.angle) {
      const hWidth = canvas.width >> 1;
      const hHeight = canvas.height >> 1;
      context.translate(hWidth, hHeight);
      context.rotate(window.Math.PI * this.angle);
      if (this.angle !== 1) {
        context.translate(-hHeight, -hWidth);
      } else {
        context.translate(-hWidth, -hHeight);
      }
    }
    // console.log(state.x, state.y, state.width, state.height, cx, cy, width, height);
    context.drawImage(this.img, this.x, this.y, this.width, this.height, cx, cy, width, height);
    context.restore();
  }
  cut (rw, rh, rx, ry, viewScale) {
    rw /= this.scale;
    rh /= this.scale;
    rx /= this.scale;
    ry /= this.scale;
    switch (this.angle) {
      case .5:
      case 1.5:
        if (this.angle === .5) {
          [rx, ry] = [ry, this.height - rx - rw];
        } else {
          [rx, ry] = [this.width - ry - rh, rx];
        }
        [rw, rh] = [rh, rw];
        break;
      case 1:
        [rx, ry] = [this.width - rw - rx, this.height - rh - ry];
        break;
      default: ;
    }
    if (rx >= this.width || ry >= this.height)
      return;
    let x, y, width, height;
    x = this.x + Math.max(rx, 0);
    y = this.y + Math.max(ry, 0);
    width = Math.min(Math.min(rx + rw, this.width) /*结束点*/ - Math.max(0, rx) /*起点*/ , this.width);
    height = Math.min(Math.min(ry + rh, this.height) /*结束点*/ - Math.max(0, ry) /*起点*/ , this.height);
    const ratio = viewScale * this.scale;
    // 让图片停留在原点
    switch (this.angle) {
      case .5:
        this.cx += (this.height + this.y - height - y) * ratio;
        this.cy += (x - this.x) * ratio;
        break;
      case 1:
        this.cx += (this.width + this.x - width - x) * ratio;
        this.cy += (this.height + this.y - height - y) * ratio;
        break;
      case 1.5:
        this.cx += (y - this.y) * ratio;
        this.cy += (this.width + this.x - width - x) * ratio;
        break;
      default:
        this.cx += (x - this.x) * ratio;
        this.cy += (y - this.y) * ratio;
    }
    Object.assign(this, { x, y, width, height });
  }
  resize (width, height) {
    const { width: sWidth, height: sHeight } = this.getSize();
    if (width >= sWidth && height >= sHeight)
      return 0;
    let scale;
    if (width && height) {
      scale = Math.min(width / sWidth, height / sHeight);
    } else if (width) {
      scale = width / sWidth;
    } else {
      scale = height / sHeight;
    }
    // 确保scale和viewScale成比例
    sprite.scale *= scale;
    return scale;
  }
  rotate (angle, viewScale) {
    const sprite = state.sprite;
    // 90,180,270转.5,1,1.5
    if (angle > 2 || angle < -2) angle = angle / 180;
    angle += this.angle;
    angle = angle < 0 ? 2 + (angle % 2) : angle % 2;
    // 只接受0,.5,1,1.5
    if (angle % .5 || angle === this.angle) return 0;
    const ratio = viewScale * .5;
    const diff = angle - this.angle;
    const { width, height } = this.getSize();
    switch (diff) {
      case -1.5:
      case .5:
      case 1.5:
      case -.5:
        this.cx -= (height - width) * ratio;
        this.cy -= (width - height) * ratio;
        break;
      default:
        this.cx -= (width - height) * ratio;
        this.cy -= (height - width) * ratio;
    }
    this.angle = angle;
    return diff;
  }
  // 设置对齐
  align (pos, canvas, viewScale) {
    const { width, height } = this.getViewSize(viewScale);
    switch (pos) {
      case 'top':
      case 1:
        this.cy = 0;
        break;
      case 'right':
      case 2:
        this.cx = canvas.width - width;
        break;
      case 'bottom':
      case 3:
        this.cy = canvas.height - height;
        break;
      case 'left':
      case 4:
        this.cx = 0;
        break;
      default: // center
        this.cx = (canvas.width - width) / 2;
        this.cy = (canvas.height - height) / 2;
    }
  }
}
class ImgEdit {
  constructor (option) {
    const id = Symbol();
    Object.defineProperty(this, 'id', {
      value: id,
      writable: false
    })
    this.canvas = null;
    data[id] = {
      sprite: null,
      viewScale: 0,
      range: {
        x: 0, // 选择范围（setRange）在图片上的x轴位置（原始坐标系统）
        y: 0, // 选择范围（setRange）在图片上的y轴位置（原始坐标系统）
        width: 0,  // 选择范围（cut）宽度（原始坐标系统）
        height: 0  // 选择范围（cut）高度（原始坐标系统）
      }, // 矩形选择框数据（左上角为原点）
      before: null,
      after: null
    };
    const state = data[id];
    // 获取canvas元素
    if (option && typeof option === 'object') {
      if (option instanceof HTMLCanvasElement)
        this.canvas = option;
      else {
        for (const k in option) {
          switch (k) {
            case 'canvas':
              this.canvas = typeof option.canvas === 'string' ? document.querySelector(option.canvas) : option.canvas;
              break;
            case 'width':
              this.canvas.width = option.width;
              break;
            case 'height':
              this.canvas.height = option.height;
              break;
            case 'before': this.before(option.before);
              break;
            case 'after': this.after(option.after);
              break;
            default:;
          }
        }
      }
    } else if (option)
      this.canvas = document.querySelector(option);
    if (this.canvas) {
      const event = moveEvent.bind(this);
      eventNames.forEach((name) => {
        this.canvas.addEventListener(name, event, false);
      })
      state.moveEvent = event;
      draw(this.canvas, state);
    }
  }
  destroy () {
    if (this.canvas) {
      eventNames.forEach((name) => {
        this.canvas.removeEventListener(name, data[this.id].moveEvent);
      })
    }
    data[this.id] = data[this.id].sprite = data[this.id].moveEvent = data[this.id].onChange = data[this.id].before = data[this.id].after = this.canvas = null;
  }
  before (fn) {
    data[this.id].before = typeof fn === 'function' ? fn : null;
    return this;
  }
  after (fn) {
    data[this.id].after = typeof fn === 'function' ? fn : null;
    return this;
  }
  onChange (fn) {
    data[this.id].onChange = typeof fn === 'function' ? fn : null;
    return this;
  }
  // 获取图片宽度
  width () {
    return data[this.id].sprite.getSize()['width'];
  }
  // 获取图片高度
  height () {
    return data[this.id].sprite.getSize()['height'];
  }
  // 调整canvas尺寸
  canvasResize (width, height) {
    if (!width && !height) return this;
    const state = data[this.id];
    if (width) {
      width >>= 0;
      const rx = (width - this.canvas.width) >> 1;
      this.canvas.width = width;
      state.cx += rx;
    }
    if (height) {
      height >>= 0;
      const ry = (height - this.canvas.height) >> 1;
      this.canvas.height = height;
      state.cy += ry;
    }
    draw(this.canvas, state);
    return this;
  }
  toDataURL (mime = 'image/jpeg', quality = .8) {
    const state = data[this.id];
    if (!state.sprite) return '';
    return save(state, 'toDataURL', mime, quality);
  }
  toBlob (mime = 'image/jpeg', quality = .8) {
    return new Promise((resolve, reject) => {
      const state = data[this.id];
      if (!state.sprite) {
        reject(new Error(state.sprite.img));
      } else {
        save(state, 'toBlob', (res) => {
          resolve(res)
        }, mime, quality);
      }
    })
  }
  // 重置
  reset (noDraw) {
    const state = data[this.id];
    !noDraw && state.sprite.init();
    state.viewScale = Math.min(1,
      this.canvas.width / state.sprite.width,
      this.canvas.height / state.sprite.height
    ); // 在画布上的显示比例（scale）
    state.range.width = state.range.height = state.range.x = state.range.y = 0;
    state.sprite.align('center', this.canvas, state.viewScale);
    if (!noDraw) {
      this.canvas && draw(this.canvas, state);
      stateChange(state, 'reset');
    }
    return this;
  }
  // 擦除辅助内容
  clean (noDraw) {
    const state = data[this.id];
    if (!state.sprite) return this;
    state.range.width = state.range.height = state.range.x = state.range.y = 0;
    if (!noDraw) {
      this.canvas && draw(this.canvas, state);
      stateChange(state, 'clean');
    }
    return this;
  }
  close () {
    data[this.id].sprite = null;
    return this;
  }
  /*
   * 异步打开图片
   * @param {object/string} file 图片资源(Image/base64/url)
   * @return {object} Promise
   */
  async open (file) {
    let img;
    try {
      if (file instanceof Image) {
        if (/^blob:/.test(file.src)) img = file;
        else img = await loadImg(file.src);
      } else {
        img = await loadImg(typeof file === 'object' ? await readFile(file) : file);
      }
    } catch(e) {
      stateChange(null, 'error');
      return this;
    }
    const state = data[this.id];
    state.sprite = new Sprite(img);
    if (this.canvas) {
      this.reset(1);
      draw(this.canvas, state);
    }
    stateChange(state, 'open');
    return this;
  }
  draw () {
    const state = data[this.id];
    this.canvas && draw(this.canvas, state);
    stateChange(state, 'draw');
    return this;
  }
  // 视图缩放
  scale (s, wheel) {
    const state = data[this.id];
    if (!state.sprite) return this;
    const sprite = state.sprite;
    // 放大比例不能小于1或大于10
    const viewScale = state.viewScale;
    const scale = s - viewScale;
    const { width, height } = sprite.getViewSize(state.viewScale);
    if (s < .1 || s > 10) {
      return this;
    } else {
      state.viewScale = s;
    }
    const { cx, cy } = sprite;
    if (wheel
        && eventData.offsetX > cx
        && eventData.offsetY > cy
        && eventData.offsetX < cx + width
        && eventData.offsetY < cy + height) {
      // 在图片范围内，以鼠标位置为中心
      sprite.cx -= ((eventData.offsetX - sprite.cx) / viewScale) * scale;
      sprite.cy -= ((eventData.offsetY - sprite.cy) / viewScale) * scale;
    } else {
      // 以图片在画布范围内中心点
      const ratio = sprite.scale * scale * .5;
      if (sprite.angle === .5 || sprite.angle === 1.5) {
        sprite.cx -= sprite.height * ratio;
        sprite.cy -= sprite.width * ratio;
      } else {
        sprite.cx -= sprite.width * ratio;
        sprite.cy -= sprite.height * ratio;
      }
    }
    this.canvas && draw(this.canvas, state);
    stateChange(state, 'scale');
    return this;
  }
  // 裁剪
  cut (rw, rh, rx = 0, ry = 0) {
    const state = data[this.id];
    const sprite = state.sprite;
    if (!sprite) return this;
    if (!rw || !rh) {
      ({ x: rx, y: ry, width: rw, height: rh } = state.range);
    } else {
      // 以图片坐标为参考
      rw = rw >> 0;
      rh = rh >> 0;
      rx = rx >> 0;
      ry = ry >> 0;
    }
    if (!rw || !rh) return this;
    sprite.cut(rw, rh, rx, ry, state.viewScale);
    this.clean(1);
    this.canvas && draw(this.canvas, state);
    stateChange(state, 'cut');
    return this;
  }
  // 调整大小
  resize (width, height) {
    const state = data[this.id];
    if (!state.sprite) return this;
    const scale = state.sprite.resize(width, height);
    if (!scale) return this;
    state.viewScale /= scale;
    if (state.range.width) {
      state.range.width = (state.range.width * scale) >> 0;
      state.range.height = (state.range.height * scale) >> 0;
      state.range.x = (state.range.x * scale) >> 0;
      state.range.y = (state.range.y * scale) >> 0;
      this.canvas && draw(this.canvas, state);
    }
    stateChange(state, 'resize');
    return this;
  }
  // 旋转
  rotate (angle) {
    const state = data[this.id];
    if (!state.sprite || !angle) return this;
    const sprite = state.sprite;
    const { width: iw, height: ih } = sprite.getSize();
    const diff = sprite.rotate(angle, state.viewScale);
    if (!diff) return this;
    if (state.range.width) {
      let { x, y, width, height } = state.range;
      switch (diff) {
        // 顺时针
        case -1.5:
        case .5: [ x, y, width, height ] = [ ih - height - y, x, height, width ];
          break;
        // 逆时针
        case -.5:
        case 1.5: [ x, y, width, height ] = [ y, iw - width - x, height, width ];
          break;
        // 平翻
        default: [ x, y ] = [ iw - width - x, ih - height - y ];
      }
      Object.assign(state.range, { x, y, width, height });
    }
    this.canvas && draw(this.canvas, state);
    stateChange(state, 'rotate');
    return this;
  }
  setRange (width, height, x = 0, y = 0) {
    const state = data[this.id];
    if (!state.sprite) return this;
    const sprite = state.sprite;
    width >>= 0;
    height >>= 0;
    x >>= 0;
    y >>= 0;
    let { width: iw, height: ih } = sprite.getSize();
    iw >>= 0;
    ih >>= 0;
    if (width && height && width > 0 && height > 0 && (width < iw || height < ih) && x >= 0 && y >= 0 && x < iw && y < ih) {
      width = Math.min(iw - x, width);
      height = Math.min(ih - y, height);
      Object.assign(state.range, { width, height, x, y });
      this.canvas && draw(this.canvas, state);
      stateChange(state, 'range');
    }
    return this;
  }
  align (pos) {
    const state = data[this.id];
    if (!state.sprite) return this;
    state.sprite.align(pos, this.canvas, state.viewScale);
    this.canvas && draw(this.canvas, state);
    stateChange(state, 'align');
    return this;
  }
}
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
export default ImgEdit;