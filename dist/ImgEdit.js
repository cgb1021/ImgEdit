(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.ImgEdit = {}));
}(this, function (exports) { 'use strict';

  /*
   * 图片编辑器
   */
  const undefined$1 = void 0;
  const data = {};
  const eventData = {
    active: false, // 点击事件开始标记
    offsetX: 0, // 点击事件开始x轴位置
    offsetY: 0 // 点击事件开始y轴位置
  };
  const fontSize = 12;
  const lineHeight = 1.2;
  let ctrlKey = false; // ctrl键按下标记
  window.addEventListener('load', () => {
    window.addEventListener("keydown", keyEvent, false);
    window.addEventListener("keyup", keyEvent, false);
  });
  /* 
   * 加载线上图片
   *
   * @param {string} url
   * @return {object} promise
   */
  const fetchImg = (url) => {
    return new Promise((resolve, reject) => {
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
      };
      xhr.onerror = (e) => {
        console.log('fetchImg err', e);
        reject(e);
      };
      xhr.open('GET', url);
      // xhr.overrideMimeType('text/plain; charset=x-user-defined')
      xhr.send(null);
    })
  };
  /* 
   * 加载图片
   *
   * @param {string} src url/base64
   * @return {object} promise
   */
  function loadImg (src) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    return new Promise((resolve, reject) => {
      img.onload = function () {
        resolve(this);
      };
      img.onerror = function (e) {
        console.error('loadImg error', e);
        reject(e);
      };
      img.src = src;
    })
  }
  /* 
   * 图片转base64
   *
   * @param {object} file
   * @return {object} promise
   */
  function readFile(file) {
    const fileReader = new FileReader;
    return new Promise((resolve, reject) => {
      fileReader.onload = (e) => { resolve(e.target.result); };
      fileReader.onerror = (e) => {
        console.error('readFile error', e);
        reject(e);
      };
      fileReader.readAsDataURL(file);
    })
  }
  // 移动事件
  function moveEvent(e) {
    e.preventDefault();
    e.stopPropagation();
    const state = data[this._id];
    if (!this.img) return;
    switch (e.type) {
      case 'mousedown':
        eventData.active = true;
        eventData.offsetX = e.offsetX - state.event.cx;
        eventData.offsetY = e.offsetY - state.event.cy;
        if (ctrlKey) {
          state.range.x = e.offsetX;
          state.range.y = e.offsetY;
        }
        break;
      case 'mouseout':
      case 'mouseup':
        eventData.active = false;
        break;
      case 'mousemove':
        if (eventData.active) {
          if (ctrlKey) {
            state.range.width = e.offsetX - state.range.x;
            state.range.height = e.offsetY - state.range.y;
          } else {
            state.event.cx = e.offsetX - eventData.offsetX;
            state.event.cy = e.offsetY - eventData.offsetY;
          }
          draw(this.canvas, state, this.img);
          if (ctrlKey) stateChange(state, 'range');
        }
        break;
      case 'mousewheel':
        const direct = e.wheelDelta ?
          e.wheelDelta > 0 ?
          0 :
          1 :
          e.detail > 0 ?
          0 :
          1; // 0 上(缩小，scale变小) 1 下(放大，scale变大)
        eventData.offsetX = e.offsetX;
        eventData.offsetY = e.offsetY;
        switch (state.angle) {
          case .5:
            state.offsetX = e.offsetY;
            state.offsetY = this.canvas.width - e.offsetX;
            break;
          case 1.5:
            state.offsetX = this.canvas.height - e.offsetY;
            state.offsetY = e.offsetX;
            break;
          case 1:
            state.offsetX = this.canvas.width - e.offsetX;
            state.offsetY = this.canvas.height - e.offsetY;
            break;
          default:
            state.offsetX = e.offsetX;
            state.offsetY = e.offsetY;
        }
        this.scale(direct ? 0.1 : -0.1);
        state.offsetX = state.offsetY = 0;
        break;
    }
  }
  function keyEvent(e) {
    switch (e.type) {
      case 'keydown':
        ctrlKey = !!e.ctrlKey;
        break;
      case 'keyup':
        ctrlKey = false;
        break;
    }
  }
  function stateChange(state, type) {
    if (state.onChange) {
      const { cx, cy } = state.event;
      const { x: rx, y: ry, width: rw, height: rh } = state.range;
      let width = Math.floor(state.width * state.scale);
      let height = Math.floor(state.height * state.scale);
      let rangeX = 0;
      let rangeY = 0;
      let rangeW = 0;
      let rangeH = 0;
      if (rw && rh) {
        rangeX = Math.floor((rx - cx) / state.scale / state.viewScale);
        rangeY = Math.floor((ry - cy) / state.scale / state.viewScale);
        rangeW = Math.floor(rw / state.scale / state.viewScale);
        rangeH = Math.floor(rh / state.scale / state.viewScale);
      }
      if (state.angle && state.angle !== 1) {
        [width, height] = [height, width];
      }
      state.onChange({ width, height, viewScale: state.viewScale.toFixed(2), range: { x: rangeX, y: rangeY, width: rangeW, height: rangeH }, type });
    }
  }
  // 设置对齐
  function align (pos, canvas, state) {
    let sWidth = state.width * state.viewScale;
    let sHeight = state.height * state.viewScale;
    switch (pos) {
      case 'top':
      case 1:
        state.event.cy = 0;
        break;
      case 'right':
      case 2:
        state.event.cx = canvas.width - (!state.angle || state.angle === 1 ? sWidth : sHeight);
        break;
      case 'bottom':
      case 3:
        state.event.cy = canvas.height - (!state.angle || state.angle === 1 ? sHeight : sWidth);
        break;
      case 'left':
      case 4:
        state.event.cx = 0;
        break;
      default: // center
        if (!state.angle || state.angle === 1) {
          state.event.cx = (canvas.width - sWidth) / 2;
          state.event.cy = (canvas.height - sHeight) / 2;
        } else {
          state.event.cx = (canvas.width - sHeight) / 2;
          state.event.cy = (canvas.height - sWidth) / 2;
        }
    }
  }
  /*
   * 画文字
   */
  function drawText (context, str, x, y, align = 'left') {
    const padding = 5;
    context.font = `${fontSize}px Arial`;
    const m = context.measureText(str);
    context.fillStyle = "rgba(255,255,255,.5)";
    context.fillRect(align !== 'right' ? x : x - m.width - padding * 2, y - fontSize * lineHeight, m.width + padding * 2 - 1, fontSize * lineHeight * 1.5 - 1);
    context.fillStyle = "#000";
    context.textAlign = align;
    context.fillText(
      str,
      align !== 'right' ? x + padding : x - padding,
      y
    );
  }
  /* 
   * 画矩形选择框
   */
  function drawRect (context, state) {
    const { cx, cy } = state.event;
    let { x: rx, y: ry, width: rw, height: rh } = state.range;
    if (rw < 0) {
      rx += rw;
      rw = -rw;
    }
    if (rh < 0) {
      ry += rh;
      rh = -rh;
    }
    if (rw && rh) {
      const ratio = state.scale / state.viewScale;
      context.setLineDash([5, 2]);
      context.strokeStyle = "black";
      context.lineWidth = 1;
      context.strokeRect(rx, ry, rw, rh);
      drawText(context, `${Math.floor((rx - cx) * ratio)}, ${Math.floor((ry - cy) * ratio)}`, rx, ry + fontSize * lineHeight);
      drawText(context, `${Math.floor(rw * ratio)} x ${Math.floor(rh * ratio)}`, rx + rw, ry + rh - fontSize * .5, 'right');
    }
  }
  /* 
   * 画图
   *
   * @param {string} img
   * @param {object} canvas
   */
  function draw (canvas, state, img) {
    // if (!canvas) return;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    // 画背景
    if (state.bg) {
      const bgSize = 10;
      const xs = Math.ceil(canvas.width / bgSize); // 画canvas背景x轴循环次数
      const ys = Math.ceil(canvas.height / bgSize); // 画canvas背景y轴循环次数
      const color1 = "#ccc";
      const color2 = "#eee"; // 画布和图片的比例
      for (let y = 0; y < ys; ++y) {
        let color = y % 2 ? color1 : color2;
        for (let x = 0; x < xs; ++x) {
          context.fillStyle = color;
          context.fillRect(x * bgSize, y * bgSize, bgSize, bgSize);
          color = color === color1 ? color2 : color1;
        }
      }
    }
    // 画图片
    if (img) {
      // 坐标转换
      const sWidth = state.width * state.viewScale;
      const sHeight = state.height * state.viewScale;
      switch (state.angle) {
        case 0.5: // 顺时针90°
          state.cx = state.event.cy;
          state.cy = canvas.width - state.event.cx - sHeight;
          break;
        case 1.5: // 逆时针90°
          state.cx = canvas.height - state.event.cy - sWidth;
          state.cy = state.event.cx;
          break;
        case 1: // 180°
          state.cx = canvas.width - state.event.cx - sWidth;
          state.cy = canvas.height - state.event.cy - sHeight;
          break;
        default: // 0°
          state.cx = state.event.cx;
          state.cy = state.event.cy;
      }
      // 变换坐标轴
      context.save();
      if (state.angle) {
        const hWidth = canvas.width * 0.5;
        const hHeight = canvas.height * 0.5;
        context.translate(hWidth, hHeight);
        context.rotate(window.Math.PI * state.angle);
        if (state.angle !== 1) {
          context.translate(-hHeight, -hWidth);
        } else {
          context.translate(-hWidth, -hHeight);
        }
      }
      // console.log(state.x, state.y, state.width, state.height, cx, cy, sWidth, sHeight);
      context.drawImage(img, state.x, state.y, state.width, state.height, state.cx, state.cy, sWidth, sHeight);
      context.restore();
      /*绘制图片结束*/
      // 画矩形选择框
      if (state.range.width && state.range.height) {
        drawRect(context, state);
      }
    }
  }
  function save (img, state, method, ...args) {
    const canvas = document.createElement("canvas");
    if (typeof canvas[method] !== 'function') return false;
    const ctx = canvas.getContext("2d");
    const { x, y, width, height } = state;
    const dWidth = canvas.width = Math.floor(width * state.scale);
    const dHeight = canvas.height = Math.floor(height * state.scale);
    if (state.angle) {
      if (state.angle !== 1) {
        // state.angle = .5, 1.5
        [canvas.width, canvas.height] = [canvas.height, canvas.width];
      }
      ctx.rotate(window.Math.PI * state.angle);
      switch (state.angle) {
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
    ctx.drawImage(img, Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height), 0, 0, dWidth, dHeight);
    return canvas[method](...args);
  }
  class ImgEdit {
    constructor (option) {
      this._id = Symbol();
      this.canvas = null;
      this.img = null, // new Image()
      data[this._id] = {
        width: 0, // 图片显示范围宽度（cut）
        height: 0, // 图片显示范围高度（cut）
        x: 0, // 图片显示范围x轴位置（cut）
        y: 0, // 图片显示范围y轴位置（cut）
        scale: 1, // 调整高宽时和原图比例（resize）
        angle: 0, // 旋转角度（rotate）
        viewScale: 0, // 在画布上的显示比例（scale）
        offsetX: 0, // 坐标变换后事件x轴位置
        offsetY: 0, // 坐标变换后事件y轴位置
        cx: 0, // 图片在画布上x轴位置（变换后坐标系统）
        cy: 0, // 图片在画布上y轴位置（变换后坐标系统）
        event: {
          cx: 0, // 图片在画布上x轴位置（原始坐标系统）
          cy: 0, // 图片在画布上y轴位置（原始坐标系统）
        },
        range: {
          x: 0, // 选择范围（setRange）在图片上的x轴位置（原始坐标系统）
          y: 0, // 选择范围（setRange）在图片上的y轴位置（原始坐标系统）
          width: 0,  // 选择范围（cut）宽度（原始坐标系统）
          height: 0  // 选择范围（cut）高度（原始坐标系统）
        }, // 坐标变换后的矩形选择框数据
        bg: true
      };
      const state = data[this._id];
      // 获取canvas元素
      if (typeof option === 'object') {
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
              case 'input':
                this.listen(option.input, option.inputListener);
                break;
              default:
                state[k] = option[k];
            }
          }
        }
      } else if (option)
        this.canvas = document.querySelector(option);
      if (this.canvas) {
        const event = moveEvent.bind(this);
        this.canvas.addEventListener('mousewheel', event, false);
        this.canvas.addEventListener('mousedown', event, false);
        this.canvas.addEventListener('mouseup', event, false);
        this.canvas.addEventListener('mouseout', event, false);
        this.canvas.addEventListener('mousemove', event, false);
        state.moveEvent = event;
        draw(this.canvas, state);
      }
    }
    destroy () {
      this.unlisten();
      if (this.canvas) {
        this.canvas.removeEventListener('mousewheel', data[this._id].moveEvent, false);
        this.canvas.removeEventListener('mousedown', data[this._id].moveEvent, false);
        this.canvas.removeEventListener('mouseup', data[this._id].moveEvent, false);
        this.canvas.removeEventListener('mouseout', data[this._id].moveEvent, false);
        this.canvas.removeEventListener('mousemove', data[this._id].moveEvent, false);
      }
      this.img = data[this._id] = data[this._id].moveEvent = data[this._id].onChange = this.input = this.canvas = null;
    }
    // 监听输入源(<input type=file>)变化
    listen (el, hook) {
      if (typeof hook === 'function')
        data[this._id].inputListener = (e) => {
          const res = hook(e);
          if (res === undefined$1 || res) {
            this.open(e.target.files[0]);
          }
        };
      else {
        data[this._id].inputListener = (e) => {
          this.open(e.target.files[0]);
        };
      }
      this.input = typeof el === 'object' && 'addEventListener' in el ? el : document.querySelector(el);
      this.input.addEventListener('change', data[this._id].inputListener);
      return this;
    }
    // 删除输入源监听
    unlisten () {
      this.input && this.input.removeEventListener('change', data[this._id].inputListener);
      return this;
    }
    onChange (fn) {
      data[this._id].onChange = typeof fn === 'function' ? fn : null;
      return this;
    }
    reset (noDraw) {
      const state = data[this._id];
      state.width = this.img.width;
      state.height = this.img.height;
      state.x = 0;
      state.y = 0;
      state.scale = 1;
      state.angle = 0;
      state.cx = 0;
      state.cy = 0;
      state.offsetX = 0;
      state.offsetY = 0;
      state.viewScale = Math.min(1,
        this.canvas.width / state.width,
        this.canvas.height / state.height
      );
      align('center', this.canvas, state);
      if (!noDraw) {
        this.canvas && draw(this.canvas, state, this.img);
        stateChange(state, 'reset');
      }
      return this;
    }
    // 擦除辅助内容
    clean (noDraw) {
      const state = data[this._id];
      if (!this.img) return this;
      state.range.width = state.range.height = 0;
      if (!noDraw) {
        this.canvas && draw(this.canvas, state, this.img);
        stateChange(state, 'clean');
      }
      return this;
    }
    close () {
      this.img = null;
      return this.reset(1);
    }
    // 获取图片宽度
    width() {
      return data[this._id].width;
    }
    // 获取图片高度
    height() {
      return data[this._id].height;
    }
    /*
     * 异步打开图片
     * @param {object/string} file 图片资源(Image/base64/url)
     * @return {object} Promise
     */
    async open (file) {
      const state = data[this._id];
      try {
        this.img = await loadImg(file instanceof Image ? file.src : (typeof file === 'object' ? await readFile(file) : file));
      } catch(e) {
        stateChange(state, 'error');
        return this;
      }
      state.width = this.img.width;
      state.height = this.img.height;
      if (this.canvas) {
        this.reset(1);
        draw(this.canvas, state, this.img);
      }
      stateChange(state, 'open');
      return this;
    }
    draw () {
      const state = data[this._id];
      this.canvas && draw(this.canvas, state, this.img);
      stateChange(state, 'draw');
      return this;
    }
    toDataURL (mime, quality) {
      if (!this.img) return '';
      return save(this.img, data[this._id], 'toDataURL', mime, quality);
    }
    toBlob (mime, quality) {
      return new Promise((resolve) => {
        if (!this.img) {
          resolve(0);
        } else {
          save(this.img, data[this._id], 'toBlob', (res) => {
            resolve(res);
          }, mime, quality);
        }
      })
    }
    // 视图缩放
    scale (scale) {
      if (!this.img) return this;
      const state = data[this._id];
      // 放大比例不能小于1或大于10
      const viewScale = state.viewScale;
      const s = viewScale + scale;
      if (s < .1 || s > 10) {
        return this;
      } else {
        state.viewScale = s;
      }
      if ((state.offsetX || state.offsetY)
          && state.offsetX - state.cx > 0
          && state.offsetY - state.cy > 0
          && state.offsetX < state.cx + state.width * viewScale
          && state.offsetY < state.cy + state.height * viewScale) {
        // 在图片范围内，以鼠标位置为中心
        state.event.cx -= ((eventData.offsetX - state.event.cx) / viewScale) * scale;
        state.event.cy -= ((eventData.offsetY - state.event.cy) / viewScale) * scale;
      } else {
        // 以图片在画布范围内中心点
        if (state.angle === .5 || state.angle === 1.5) {
          state.event.cx -= state.height * scale * .5;
          state.event.cy -= state.width * scale * .5;
        } else {
          state.event.cx -= state.width * scale * .5;
          state.event.cy -= state.height * scale * .5;
        }
      }
      this.canvas && draw(this.canvas, state, this.img);
      stateChange(state, 'scale');
      return this;
    }
    // 裁剪
    cut (rw, rh, rx = 0, ry = 0) {
      if (!this.img) return this;
      const state = data[this._id];
      let x, y, width, height;
      if (!rw || !rh) {
        // 以画布坐标为参考
        const xEnd = state.cx + state.width * state.viewScale;
        const yEnd = state.cy + state.height * state.viewScale;
        const canvas = this.canvas;
        switch (state.angle) {
          case 0.5: // 顺时针90°
            [rx, ry, rw, rh] = [state.range.y, canvas.width - state.range.x - state.range.width, state.range.height, state.range.width];
            break;
          case 1.5: // 逆时针90°
            [rx, ry, rw, rh] = [canvas.height - state.range.y - state.range.height, state.range.x, state.range.height, state.range.width];
            break;
          case 1: // 180°
            [rx, ry, rw, rh] = [canvas.width - state.range.x - state.range.width, canvas.height - state.range.y - state.range.height, state.range.width, state.range.height];
            break;
          default: // 0°
            [rx, ry, rw, rh] = [state.range.x, state.range.y, state.range.width, state.range.height];
        }
        // console.log(!rw, !rh, rx + rw <= state.cx, ry + rh <= state.cy, rx >= xEnd, ry >= yEnd)
        // 是否在图片范围内
        if (!rw || !rh || rx + rw <= state.cx || ry + rh <= state.cy || rx >= xEnd || ry >= yEnd)
          return this;
        x = state.x + Math.max((rx - state.cx) / state.viewScale, 0);
        y = state.y + Math.max((ry - state.cy) / state.viewScale, 0);
        width = Math.min((Math.min(rx + rw, xEnd) - Math.max(state.cx, rx)) / state.viewScale, state.width);
        height = Math.min((Math.min(ry + rh, yEnd) - Math.max(state.cy, ry)) / state.viewScale, state.height);
      } else {
        // 以图片坐标为参考
        rw = (rw >> 0) / state.scale;
        rh = (rh >> 0) / state.scale;
        rx = (rx >> 0) / state.scale;
        ry = (ry >> 0) / state.scale;
        switch (state.angle) {
          case .5:
          case 1.5:
            if (state.angle === .5) {
              [rx, ry] = [ry, state.height - rx - rw];
            } else {
              [rx, ry] = [state.width - ry - rh, rx];
            }
            [rw, rh] = [rh, rw];
            break;
          case 1:
            [rx, ry] = [state.width - rw - rx, state.height - rh - ry];
            break;
          default:
        }
        if (rx >= state.width || ry >= state.height)
          return this;
        x = state.x + Math.max(rx, 0);
        y = state.y + Math.max(ry, 0);
        width = Math.min(Math.min(rx + rw, state.width) /*结束点*/ - Math.max(0, rx) /*起点*/ , state.width);
        height = Math.min(Math.min(ry + rh, state.height) /*结束点*/ - Math.max(0, ry) /*起点*/ , state.height);
      }
      // 让图片停留在原点
      switch (state.angle) {
        case .5:
          state.event.cx += (state.height + state.y - height - y) * state.viewScale;
          state.event.cy += (x - state.x) * state.viewScale;
          break;
        case 1:
          state.event.cx += (state.width + state.x - width - x) * state.viewScale;
          state.event.cy += (state.height + state.y - height - y) * state.viewScale;
          break;
        case 1.5:
          state.event.cx += (y - state.y) * state.viewScale;
          state.event.cy += (state.width + state.x - width - x) * state.viewScale;
          break;
        default:
          state.event.cx += (x - state.x) * state.viewScale;
          state.event.cy += (y - state.y) * state.viewScale;
      }
      Object.assign(state, { x, y, width, height });
      this.clean(1);
      this.canvas && draw(this.canvas, state, this.img);
      stateChange(state, 'cut');
      return this;
    }
    // 调整大小
    resize (width, height) {
      if (!this.img) return this;
      const state = data[this._id];
      let sWidth = state.width * state.scale;
      let sHeight = state.height * state.scale;
      if (state.angle && state.angle !== 1) {
        [sWidth, sHeight] = [sHeight, sWidth];
      }
      if (width >= sWidth && height >= sHeight)
        return this;
      let scale;
      if (width && height) {
        scale = Math.min(width / sWidth, height / sHeight);
      } else if (width) {
        scale = width / sWidth;
      } else {
        scale = height / sHeight;
      }
      state.scale *= scale;
      stateChange(state, 'resize');
      return this;
    }
    // 旋转
    rotate (angle) {
      if (!this.img) return this;
      const state = data[this._id];
      // 90,180,270转.5,1,1.5
      if (angle > 2 || angle < -2) angle = angle / 90 * .5;
      angle += state.angle;
      angle = angle < 0 ? 2 + (angle % 2) : angle % 2;
      // 只接受0,.5,1,1.5
      if (angle % .5) return this;
      state.angle = angle;
      if (state.angle === .5 || state.angle === 1.5) {
        state.event.cx -= (state.height - state.width) * .5 * state.viewScale;
        state.event.cy -= (state.width - state.height) * .5 * state.viewScale;
      } else {
        state.event.cx -= (state.width - state.height) * .5 * state.viewScale;
        state.event.cy -= (state.height - state.width) * .5 * state.viewScale;
      }
      this.canvas && draw(this.canvas, state, this.img);
      stateChange(state, 'rotate');
      return this;
    }
    setRange (width, height, x = 0, y = 0) {
      if (!this.img) return this;
      const state = data[this._id];
      if (width && height) {
        const ratio = state.viewScale / state.scale;
        state.range.width = (width >> 0) * ratio;
        state.range.height = (height >> 0) * ratio;
        state.range.x = (x >> 0) * ratio + state.event.cx;
        state.range.y = (y >> 0) * ratio + state.event.cy;
        this.canvas && draw(this.canvas, state, this.img);
        stateChange(state, 'range');
      }
      return this;
    }
    align (pos) {
      if (!this.img) return this;
      const state = data[this._id];
      align(pos, this.canvas, state);
      this.canvas && draw(this.canvas, state, this.img);
      stateChange(state, 'align');
      return this;
    }
  }
  const resize = async (img, width, height) => {
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
  };
  const cut = async (img, width, height, x, y) => {
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
  };
  const rotate = async (img, deg) => {
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
  };

  exports.cut = cut;
  exports.default = ImgEdit;
  exports.fetchImg = fetchImg;
  exports.loadImg = loadImg;
  exports.readFile = readFile;
  exports.resize = resize;
  exports.rotate = rotate;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
