(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.ImgEdit = {}));
}(this, function (exports) { 'use strict';

  /*
   * 图片编辑器（图片编辑而不是图片合成）
   */
  const undefined$1 = void 0;
  const data = {};
  const eventData = {
    active: false, // 点击事件开始标记
    offsetX: 0, // 点击事件开始x轴位置
    offsetY: 0 // 点击事件开始y轴位置
  };
  let ctrlKey = false; // ctrl键按下标记
  // 移动事件
  function moveEvent(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!this.img) return;
    const state = data[this.id];
    const { cx, cy } = state;
    const { width: iw, height: ih } = getSize(state);
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
            state.cx = e.offsetX - eventData.offsetX;
            state.cy = e.offsetY - eventData.offsetY;
          }
          draw(this.canvas, state, this.img);
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
  function getSize (state) {
    const ratio = state.viewScale * state.scale;
    const [width, height] = state.angle === .5 || state.angle === 1.5 ? [state.height * ratio, state.width * ratio] : [state.width * ratio, state.height * ratio];
    return { width, height, ratio };
  }
  function stateChange (state, type) {
    if (state.onChange) {
      const range = Object.assign({}, state.range);
      let width = (state.width * state.scale) >> 0;
      let height = (state.height * state.scale) >> 0;
      if (state.angle && state.angle !== 1) {
        [width, height] = [height, width];
      }
      state.onChange({ width, height, scale: window.parseFloat(state.viewScale.toFixed(2)), range, type });
    }
  }
  // 设置对齐
  function align (pos, canvas, state) {
    const { width, height } = getSize(state);
    switch (pos) {
      case 'top':
      case 1:
        state.cy = 0;
        break;
      case 'right':
      case 2:
        state.cx = canvas.width - width;
        break;
      case 'bottom':
      case 3:
        state.cy = canvas.height - height;
        break;
      case 'left':
      case 4:
        state.cx = 0;
        break;
      default: // center
        state.cx = (canvas.width - width) / 2;
        state.cy = (canvas.height - height) / 2;
    }
  }
  /* 
   * 画矩形选择框
   */
  function drawRect (context, state) {
    const { cx, cy } = state;
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
  function draw (canvas, state, img) {
    // if (!canvas) return;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    // 画背景
    state.before && state.before(context);
    // 画图片
    if (img) {
      // 坐标转换
      const ratio = state.viewScale * state.scale;
      const width = state.width * ratio;
      const height = state.height * ratio;
      let cx, cy;
      switch (state.angle) {
        case 0.5: // 顺时针90°
          cx = state.cy;
          cy = canvas.width - state.cx - height;
          break;
        case 1.5: // 逆时针90°
          cx = canvas.height - state.cy - width;
          cy = state.cx;
          break;
        case 1: // 180°
          cx = canvas.width - state.cx - width;
          cy = canvas.height - state.cy - height;
          break;
        default: // 0°
          cx = state.cx;
          cy = state.cy;
      }
      // 变换坐标轴
      context.save();
      if (state.angle) {
        const hWidth = canvas.width >> 1;
        const hHeight = canvas.height >> 1;
        context.translate(hWidth, hHeight);
        context.rotate(window.Math.PI * state.angle);
        if (state.angle !== 1) {
          context.translate(-hHeight, -hWidth);
        } else {
          context.translate(-hWidth, -hHeight);
        }
      }
      // console.log(state.x, state.y, state.width, state.height, cx, cy, width, height);
      context.drawImage(img, state.x, state.y, state.width, state.height, cx, cy, width, height);
      context.restore();
      /*绘制图片结束*/
      // 画矩形选择框
      if (state.range.width && state.range.height) {
        drawRect(context, state);
      }
    }
    state.after && state.after(context);
  }
  function save (img, state, method, ...args) {
    const canvas = document.createElement("canvas");
    // if (typeof canvas[method] !== 'function') return false;
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
      const id = Symbol();
      Object.defineProperty(this, 'id', {
        value: id,
        writable: false
      });
      this.canvas = null;
      this.img = null, // new Image()
      data[id] = {
        width: 0, // 图片显示范围宽度（cut）
        height: 0, // 图片显示范围高度（cut）
        x: 0, // 图片显示范围x轴位置（cut）
        y: 0, // 图片显示范围y轴位置（cut）
        scale: 1, // 调整高宽时和原图比例（resize）
        angle: 0, // 旋转角度（rotate）
        viewScale: 0, // 在画布上的显示比例（scale）
        cx: 0, // 图片在画布上x轴位置
        cy: 0, // 图片在画布上y轴位置
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
              default:
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
      if (this.canvas) {
        this.canvas.removeEventListener('mousewheel', data[this.id].moveEvent, false);
        this.canvas.removeEventListener('mousedown', data[this.id].moveEvent, false);
        this.canvas.removeEventListener('mouseup', data[this.id].moveEvent, false);
        this.canvas.removeEventListener('mouseout', data[this.id].moveEvent, false);
        this.canvas.removeEventListener('mousemove', data[this.id].moveEvent, false);
      }
      this.img = data[this.id] = data[this.id].moveEvent = data[this.id].onChange = data[this.id].before = data[this.id].after = this.input = this.canvas = null;
    }
    // 监听输入源(<input type=file|text>)变化
    listen(el, hook) {
      data[this.id].inputListener = typeof hook === 'function' ? (e) => {
        const res = hook(e);
        if (res === undefined$1 || res) {
          this.open(/file/i.test(e.target.type) ? e.target.files[0] : e.target.value);
        }
      } : (e) => {
        this.open(/file/i.test(e.target.type) ? e.target.files[0] : e.target.value);
      };
      this.input = typeof el === 'object' && 'addEventListener' in el ? el : document.querySelector(el);
      this.input.addEventListener('change', data[this.id].inputListener);
      return this;
    }
    // 删除输入源监听
    unlisten () {
      if (this.input) {
        this.input.removeEventListener('change', data[this.id].inputListener);
        data[this.id].inputListener = null;
      }
      return this;
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
      const state = data[this.id];
      return (state.width * state.scale) >> 0;
    }
    // 获取图片高度
    height () {
      const state = data[this.id];
      return (state.height * state.scale) >> 0;
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
      draw(this.canvas, state, this.img);
      return this;
    }
    // 重置
    reset (noDraw) {
      const state = data[this.id];
      state.width = this.img.width;
      state.height = this.img.height;
      state.x = 0;
      state.y = 0;
      state.scale = 1;
      state.angle = 0;
      state.cx = 0;
      state.cy = 0;
      state.viewScale = Math.min(1,
        this.canvas.width / state.width,
        this.canvas.height / state.height
      );
      state.range.width = state.range.height = state.range.x = state.range.y = 0;
      align('center', this.canvas, state);
      if (!noDraw) {
        this.canvas && draw(this.canvas, state, this.img);
        stateChange(state, 'reset');
      }
      return this;
    }
    // 擦除辅助内容
    clean (noDraw) {
      const state = data[this.id];
      if (!this.img) return this;
      state.range.width = state.range.height = state.range.x = state.range.y = 0;
      if (!noDraw) {
        this.canvas && draw(this.canvas, state, this.img);
        stateChange(state, 'clean');
      }
      return this;
    }
    close () {
      this.img = null;
      return this;
    }
    /*
     * 异步打开图片
     * @param {object/string} file 图片资源(Image/base64/url)
     * @return {object} Promise
     */
    async open (file) {
      try {
        if (file instanceof Image) {
          if (/^blob:/.test(file.src)) this.img = file;
          else this.img = await loadImg(file.src);
        } else {
          this.img = await loadImg(typeof file === 'object' ? await readFile(file) : file);
        }
      } catch(e) {
        stateChange(null, 'error');
        return this;
      }
      const state = data[this.id];
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
      const state = data[this.id];
      this.canvas && draw(this.canvas, state, this.img);
      stateChange(state, 'draw');
      return this;
    }
    toDataURL (mime = 'image/jpeg', quality = .8) {
      if (!this.img) return '';
      return save(this.img, data[this.id], 'toDataURL', mime, quality);
    }
    toBlob (mime = 'image/jpeg', quality = .8) {
      return new Promise((resolve, reject) => {
        if (!this.img) {
          reject(new Error(this.img));
        } else {
          save(this.img, data[this.id], 'toBlob', (res) => {
            resolve(res);
          }, mime, quality);
        }
      })
    }
    // 视图缩放
    scale (s, wheel) {
      if (!this.img) return this;
      const state = data[this.id];
      // 放大比例不能小于1或大于10
      const viewScale = state.viewScale;
      const scale = s - viewScale;
      const { width, height } = getSize(state);
      if (s < .1 || s > 10) {
        return this;
      } else {
        state.viewScale = s;
      }
      const { cx, cy } = state;
      if (wheel
          && eventData.offsetX > cx
          && eventData.offsetY > cy
          && eventData.offsetX < cx + width
          && eventData.offsetY < cy + height) {
        // 在图片范围内，以鼠标位置为中心
        state.cx -= ((eventData.offsetX - state.cx) / viewScale) * scale;
        state.cy -= ((eventData.offsetY - state.cy) / viewScale) * scale;
      } else {
        // 以图片在画布范围内中心点
        const ratio = state.scale * scale * .5;
        if (state.angle === .5 || state.angle === 1.5) {
          state.cx -= state.height * ratio;
          state.cy -= state.width * ratio;
        } else {
          state.cx -= state.width * ratio;
          state.cy -= state.height * ratio;
        }
      }
      this.canvas && draw(this.canvas, state, this.img);
      stateChange(state, 'scale');
      return this;
    }
    // 裁剪
    cut (rw, rh, rx = 0, ry = 0) {
      if (!this.img) return this;
      const state = data[this.id];
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
      rw = rw / state.scale;
      rh = rh / state.scale;
      rx = rx / state.scale;
      ry = ry / state.scale;
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
      let x, y, width, height;
      x = state.x + Math.max(rx, 0);
      y = state.y + Math.max(ry, 0);
      width = Math.min(Math.min(rx + rw, state.width) /*结束点*/ - Math.max(0, rx) /*起点*/, state.width);
      height = Math.min(Math.min(ry + rh, state.height) /*结束点*/ - Math.max(0, ry) /*起点*/, state.height);
      const ratio = state.viewScale * state.scale;
      // 让图片停留在原点
      switch (state.angle) {
        case .5:
          state.cx += (state.height + state.y - height - y) * ratio;
          state.cy += (x - state.x) * ratio;
          break;
        case 1:
          state.cx += (state.width + state.x - width - x) * ratio;
          state.cy += (state.height + state.y - height - y) * ratio;
          break;
        case 1.5:
          state.cx += (y - state.y) * ratio;
          state.cy += (state.width + state.x - width - x) * ratio;
          break;
        default:
          state.cx += (x - state.x) * ratio;
          state.cy += (y - state.y) * ratio;
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
      const state = data[this.id];
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
      // 确保scale和viewScale成比例
      state.scale *= scale;
      state.viewScale /= scale;
      if (state.range.width) {
        state.range.width = (state.range.width * scale) >> 0;
        state.range.height = (state.range.height * scale) >> 0;
        state.range.x = (state.range.x * scale) >> 0;
        state.range.y = (state.range.y * scale) >> 0;
        this.canvas && draw(this.canvas, state, this.img);
      }
      stateChange(state, 'resize');
      return this;
    }
    // 旋转
    rotate (angle) {
      if (!this.img || !angle) return this;
      const state = data[this.id];
      // 90,180,270转.5,1,1.5
      if (angle > 2 || angle < -2) angle = angle / 180;
      angle += state.angle;
      angle = angle < 0 ? 2 + (angle % 2) : angle % 2;
      // 只接受0,.5,1,1.5
      if (angle % .5 || angle === state.angle) return this;
      const ratio = state.viewScale * .5;
      const diff = angle - state.angle;
      const [ iw, ih ] = state.angle === .5 || state.angle === 1.5 ? [ state.height * state.scale, state.width * state.scale ] : [ state.width * state.scale, state.height * state.scale ];
      switch (diff) {
        case -1.5:
        case .5:
        case 1.5:
        case -.5:
          state.cx -= (ih - iw) * ratio;
          state.cy -= (iw - ih) * ratio;
          break;
        default:
          state.cx -= (iw - ih) * ratio;
          state.cy -= (ih - iw) * ratio;
      }
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
      state.angle = angle;
      this.canvas && draw(this.canvas, state, this.img);
      stateChange(state, 'rotate');
      return this;
    }
    setRange (width, height, x = 0, y = 0) {
      if (!this.img) return this;
      const state = data[this.id];
      width >>= 0;
      height >>= 0;
      x >>= 0;
      y >>= 0;
      const [ iw, ih ] = state.angle === .5 || state.angle === 1.5 ? [ (state.height * state.scale) >> 0, (state.width * state.scale) >> 0 ] : [ (state.width * state.scale) >> 0, (state.height * state.scale) >> 0 ];
      if (width && height && width > 0 && height > 0 && (width < iw || height < ih) && x >= 0 && y >= 0 && x < iw && y < ih) {
        width = Math.min(iw - x, width);
        height = Math.min(ih - y, height);
        Object.assign(state.range, { width, height, x, y });
        this.canvas && draw(this.canvas, state, this.img);
        stateChange(state, 'range');
      }
      return this;
    }
    align (pos) {
      if (!this.img) return this;
      const state = data[this.id];
      align(pos, this.canvas, state);
      this.canvas && draw(this.canvas, state, this.img);
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
  const fetchImg = (url) => {
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
      };
      xhr.onerror = (e) => {
        console.error('fetchImg err', e);
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
  function loadImg(src) {
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
      };
      img.onerror = function (e) {
        console.error('loadImg error', e);
        img = img.onload = img.onerror = null;
        reject(e);
      };
      img.src = src;
    })
  }
  /* 
   * 图片转base64
   *
   * @param {blob} file
   * @return {object} promise
   */
  function readFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || typeof file !== 'object') reject(0);
      let fileReader = new FileReader;
      fileReader.onload = (e) => {
        resolve(e.target.result);
        fileReader = fileReader.onload = fileReader.onerror = null;
      };
      fileReader.onerror = (e) => {
        console.error('readFile error', e);
        fileReader = fileReader.onload = fileReader.onerror = null;
        reject(e);
      };
      fileReader.readAsDataURL(file);
    })
  }
  /* 
   * 上传图片预览
   *
   * @param {blob} file
   * @return {object} promise
   */
  const preview = (file) => {
    return new Promise((resolve, reject) => {
      if (!file || typeof file !== 'object') reject(0);
      let img = new Image;
      img.onload = function () {
        URL.revokeObjectURL(this.src);
      };
      img.onerror = (e) => {
        reject(e);
      };
      img.src = URL.createObjectURL(file);
      resolve(img);
    })
  };
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
  exports.preview = preview;
  exports.readFile = readFile;
  exports.resize = resize;
  exports.rotate = rotate;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
