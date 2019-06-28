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
     offsetY: 0, // 点击事件开始y轴位置
     cx: 0, // 原始坐标系统下在画布x轴位置
     cy: 0, // 原始坐标系统下在画布y轴位置
     rx: 0, // 原始坐标系统下的矩形选择框x轴位置（offsetX）
     ry: 0, // 原始坐标系统下的矩形选择框y轴位置（offsetY）
     rw: 0, // 原始坐标系统下的矩形选择框宽度
     rh: 0 // 原始坐标系统下的矩形选择框高度
   };
   const fontSize = 12;
   const lineHeight = 1.2;
   let altKey = false; // alt键按下标记
   window.addEventListener('load', () => {
     window.addEventListener("keydown", keyEvent, false);
     window.addEventListener("keyup", keyEvent, false);
   });
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
    return new Promise((res) => {
      fileReader.onload = (e) => { res(e.target.result); };
      fileReader.readAsDataURL(file);
    })
  }
  // 移动事件
  function moveEvent(e) {
    e.preventDefault();
    e.stopPropagation();
    switch (e.type) {
      case "mousedown":
        eventData.active = true;
        eventData.offsetX = e.offsetX - eventData.cx;
        eventData.offsetY = e.offsetY - eventData.cy;
        if (altKey) {
          eventData.rx = e.offsetX;
          eventData.ry = e.offsetY;
        }
        break;
      case "mouseup":
        eventData.active = false;
        break;
      case "mousemove":
        if (eventData.active) {
          if (altKey) {
            eventData.rw = e.offsetX - eventData.rx;
            eventData.rh = e.offsetY - eventData.ry;
          } else {
            eventData.cx = e.offsetX - eventData.offsetX;
            eventData.cy = e.offsetY - eventData.offsetY;
          }
          this.draw();
        }
        break;
      case "mousewheel":
        const direct = e.wheelDelta ?
          e.wheelDelta > 0 ?
          0 :
          1 :
          e.detail > 0 ?
          0 :
          1; // 0 上(缩小，scale变小) 1 下(放大，scale变大)
        const state = data[this._id];

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
        break;
    }
  }
  function keyEvent(e) {
    switch (e.type) {
      case "keydown":
        altKey = !!e.altKey;
        break;
      case "keyup":
        altKey = false;
        break;
    }
  }
  function stateChange(state, type) {
    if (state.onChange) {
      const { rx, ry, rw, rh, cx, cy } = eventData;
      let width = Math.floor(state.width * state.scale);
      let height = Math.floor(state.height * state.scale);
      let rangeX = 0;
      let rangeY = 0;
      let rangeW = 0;
      let rangeH = 0;

      if (rw && rh) {
        rangeX = Math.floor((rx - cx) / state.ratio * state.scale / state.viewScale);
        rangeY = Math.floor((ry - cy) / state.ratio * state.scale / state.viewScale);
        rangeW = Math.floor(rw / state.ratio * state.scale / state.viewScale);
        rangeH = Math.floor(rh / state.ratio * state.scale / state.viewScale);
      }
      if (state.angle && state.angle !== 1) {
        [width, height] = [height, width];
      }
      state.onChange({ width, height, viewScale: state.viewScale.toFixed(2), range: { x: rangeX, y: rangeY, width: rangeW, height: rangeH }, type });
    }
  }
  // 设置对齐
  function align (pos, canvas, state) {
    let sWidth = state.width * state.ratio * state.viewScale;
    let sHeight = state.height * state.ratio * state.viewScale;

    switch (pos) {
      case 'top':
      case 1:
        eventData.cy = 0;
        break;
      case 'right':
      case 2:
        eventData.cx = canvas.width - (!state.angle || state.angle === 1 ? sWidth : sHeight);
        break;
      case 'bottom':
      case 3:
        eventData.cy = canvas.height - (!state.angle || state.angle === 1 ? sHeight : sWidth);
        break;
      case 'left':
      case 4:
        eventData.cx = 0;
        break;
      default:
        if (!state.angle || state.angle === 1) {
          eventData.cx = (canvas.width - sWidth) / 2;
          eventData.cy = (canvas.height - sHeight) / 2;
        } else {
          eventData.cx = (canvas.width - sHeight) / 2;
          eventData.cy = (canvas.height - sWidth) / 2;
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
    let { rx, ry, rw, rh, cx, cy } = eventData;
    if (rw < 0) {
      rx += rw;
      rw = -rw;
    }
    if (rh < 0) {
      ry += rh;
      rh = -rh;
    }

    if (rw && rh) {
      const rt = state.scale / state.ratio / state.viewScale;

      context.setLineDash([5, 2]);
      context.strokeStyle = "black";
      context.lineWidth = 1;
      context.strokeRect(rx, ry, rw, rh);

      drawText(context, `${Math.floor((rx - cx) * rt)}, ${Math.floor((ry - cy) * rt)}`, rx, ry + fontSize * lineHeight);
      drawText(context, `${Math.floor(rw * rt)} x ${Math.floor(rh * rt)}`, rx + rw, ry + rh - fontSize * .5, 'right');
    }
  }
  /* 
   * 画图
   *
   * @param {string} img
   * @param {object} canvas
   */
  function draw (img, canvas, state) {
    if (!canvas) return;
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
      if (!state.angle || state.angle === 1) {
        state.ratio = Math.min(
          canvas.width / state.width,
          canvas.height / state.height
        );
      } else {
        state.ratio = Math.min(
          canvas.width / state.height,
          canvas.height / state.width
        );
      }
      if (state.cx === null && state.cy === null) {
        // 图片居中
        align('center', canvas, state);
      }
      // 坐标转换
      const sWidth = state.width * state.ratio * state.viewScale;
      const sHeight = state.height * state.ratio * state.viewScale;
      const hWidth = canvas.width * 0.5;
      const hHeight = canvas.height * 0.5;
      switch (state.angle) {
        case 0.5: // 顺时针90°
          state.cx = eventData.cy;
          state.cy = canvas.width - eventData.cx - sHeight;
          [state.range.rx, state.range.ry, state.range.rw, state.range.rh] = [eventData.ry, canvas.width - eventData.rx - eventData.rw, eventData.rh, eventData.rw];
          break;
        case 1.5: // 逆时针90°
          state.cx = canvas.height - eventData.cy - sWidth;
          state.cy = eventData.cx;
          [state.range.rx, state.range.ry, state.range.rw, state.range.rh] = [canvas.height - eventData.ry - eventData.rh, eventData.rx, eventData.rh, eventData.rw];
          break;
        case 1: // 180°
          state.cx = canvas.width - eventData.cx - sWidth;
          state.cy = canvas.height - eventData.cy - sHeight;
          [state.range.rx, state.range.ry, state.range.rw, state.range.rh] = [canvas.width - eventData.rx - eventData.rw, canvas.height - eventData.ry - eventData.rh, eventData.rw, eventData.rh];
          break;
        default: // 0°
          state.cx = eventData.cx;
          state.cy = eventData.cy;
          [state.range.rx, state.range.ry, state.range.rw, state.range.rh] = [eventData.rx, eventData.ry, eventData.rw, eventData.rh];
      }
      // 变换坐标轴
      context.save();
      if (state.angle) {
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
      if (eventData.rw && eventData.rh) {
        drawRect(context, state);
        stateChange(state, 'range');
      }
    }
  }
  class ImgEdit {
    constructor (option) {
      this._id = Symbol();
      this.canvas = null;
      data[this._id] = {
        img: null, // new Image()
        width: 0, // 图片裁剪范围宽度
        height: 0, // 图片裁剪范围高度
        x: 0, // 图片上的x轴位置
        y: 0, // 图片上的y轴位置
        cx: null, // 坐标变换后画图x轴位置（画布上）
        cy: null, // 坐标变换后画图y轴位置（画布上）
        angle: 0, // 旋转角度
        scale: 1, // 调整宽高时的缩放比例(和输出有关系)
        ratio: 1, // 图片和画布的高宽比例
        viewScale: 1, // 与画布的缩放比例（和显示有关系）
        offsetX: 0, // 坐标变换后事件x轴位置
        offsetY: 0, // 坐标变换后事件y轴位置
        range: {
          rx: 0,
          ry: 0,
          rw: 0,
          rh: 0
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
      } else
        this.canvas = document.querySelector(option);
      if (this.canvas) {
        const event = moveEvent.bind(this);
        this.canvas.addEventListener("mousewheel", event, false);
        this.canvas.addEventListener("mousedown", event, false);
        this.canvas.addEventListener("mouseup", event, false);
        this.canvas.addEventListener("mousemove", event, false);
        state.moveEvent = event;
        draw(null, this.canvas, state);
      }
    }
    reset() {
      const state = data[this._id];
      state.x = 0;
      state.y = 0;
      state.angle = 0;
      state.scale = 1;
      state.ratio = 1;
      state.viewScale = 1;
      state.offsetX = 0;
      state.offsetY = 0;
      state.cx = null;
      state.cy = null;
      return this;
    }
    destroy () {
      this.unlisten();
      if (this.canvas) {
        this.canvas.removeEventListener("mousewheel", data[this._id].moveEvent, false);
        this.canvas.removeEventListener("mousedown", data[this._id].moveEvent, false);
        this.canvas.removeEventListener("mouseup", data[this._id].moveEvent, false);
        this.canvas.removeEventListener("mousemove", data[this._id].moveEvent, false);
      }
      data[this._id] = data[this._id].moveEvent = data[this._id].onChange = data[this._id].img = this.input = this.canvas = null;
    }
    // 监听输入源(<input type=file>)变化
    listen (el, hook) {
      if (typeof hook === 'function')
        data[this._id].inputListener = (e) => {
          const res = hook(e);
          if (res === undefined$1 || res) {
            this.open(e.target.files[0]).then(() => {
              this.draw();
            });
          }
        };
      else {
        data[this._id].inputListener = (e) => {
          this.open(e.target.files[0]).then(() => {
            this.draw();
          });
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
    /*
     * 异步打开图片
     * @param {object/string} file 图片资源(Image/base64/url)
     * @return {object} Promise
     */
    async open (file) {
      const state = data[this._id];
      state.img = await loadImg(file instanceof Image ? file.src : (typeof file === 'object' ? await readFile(file) : file));
      state.width = state.img.width;
      state.height = state.img.height;
      this.reset();
      return this;
    }
    draw () {
      draw(data[this._id].img, this.canvas, data[this._id]);
      return this;
    }
    toDataURL (mime, quality) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const state = data[this._id];
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
      ctx.drawImage(state.img, Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height), 0, 0, dWidth, dHeight);
      return canvas.toDataURL(mime, quality);
    }
    toBlob () {
      console.log('toBlob');
    }
    // 清理选择矩形
    clean () {
      data[this._id].viewScale = 1;
      data[this._id].cx = data[this._id].cy = null;
    }
    // 获取图片宽度
    width () {
      return data[this._id].width;
    }
    // 获取图片高度
    height () {
      return data[this._id].height;
    }
    // 视图缩放
    scale (scale) {
      const state = data[this._id];
      const x = state.offsetX - state.cx;
      const y = state.offsetY - state.cy;
      const s = state.viewScale + scale;

      // 放大比例不能小于1或大于10
      if (s < 1 || s > 10) {
        return this;
      } else {
        state.viewScale = s;
      }
      // 在图片范围内
      if (x > 0 && y > 0 && state.offsetX < state.cx + state.width * state.ratio * state.viewScale && state.offsetY < state.cy + state.height * state.ratio * state.viewScale) {
        eventData.cx -= ((eventData.offsetX - eventData.cx) / (state.viewScale - scale)) * scale;
        eventData.cy -= ((eventData.offsetY - eventData.cy) / (state.viewScale - scale)) * scale;
      }

      this.draw();
      stateChange(state, 'scale');

      return this;
    }
    // 裁剪
    cut (rw, rh, rx = 0, ry = 0) {
      const state = data[this._id];
      let x, y, width, height;
      if (!rw || !rh) {
        const rt = state.ratio * state.viewScale;
        const xEnd = state.cx + state.width * rt;
        const yEnd = state.cy + state.height * rt;
        ({ rx, ry, rw, rh } = state.range);
        // console.log(!rw, !rh, rx + rw <= state.cx, ry + rh <= state.cy, rx >= xEnd, ry >= yEnd)
        // 是否在图片范围内
        if (!rw || !rh || rx + rw <= state.cx || ry + rh <= state.cy || rx >= xEnd || ry >= yEnd)
          return this;

        x = state.x + Math.max((rx - state.cx) / rt, 0);
        y = state.y + Math.max((ry - state.cy) / rt, 0);
        width = Math.min((Math.min(rx + rw, xEnd) - Math.max(state.cx, rx)) / rt, state.width);
        height = Math.min((Math.min(ry + rh, yEnd) - Math.max(state.cy, ry)) / rt, state.height);
      } else {
        rw = (rw >> 0) / state.scale;
        rh = (rh >> 0) / state.scale;
        rx = (rx >> 0) / state.scale;
        ry = (ry >> 0) / state.scale;

        if (state.angle) {
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
            default:
              [rx, ry] = [state.width - rw - rx, state.height - rh - ry];
          }
        }

        if (rx >= state.width || ry >= state.height)
          return this;

        x = state.x + Math.max(rx, 0);
        y = state.y + Math.max(ry, 0);
        width = Math.min(Math.min(rx + rw, state.width) /*结束点*/ - Math.max(0, rx) /*起点*/ , state.width);
        height = Math.min(Math.min(ry + rh, state.height) /*结束点*/ - Math.max(0, ry) /*起点*/ , state.height);
      }
      Object.assign(state, { x, y, width, height });
      this.clean();
      this.eraser();
      stateChange(state, 'cut');
      return this;
    }
    // 调整大小
    resize (width, height) {
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
      return this;
    }
    // 旋转
    rotate (angle) {
      const state = data[this._id];
      // 角度转换
      switch (angle) {
        case -.5:
        case .5:
        case -1.5:
        case 1.5:
        case 0:
        case -1:
        case 1:
          break;
        default:
          if (angle % 90) return this;
          angle = angle / 90 * .5;
      }

      angle += state.angle;
      state.angle = angle < 0 ? 2 + (angle % 2) : angle % 2;
      align('center', this.canvas, state);
      this.draw();
      stateChange(state, 'rotate');

      return this;
    }
    // 擦除辅助内容
    eraser() {
      eventData.rw = eventData.rh = 0;
      this.draw();
      stateChange(data[this._id], 'range');

      return this;
    }
  }
  const fetchImg = (url) => {
    return new Promise((resolve) => {
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
      xhr.open('GET', url);
      // xhr.overrideMimeType('text/plain; charset=x-user-defined')
      xhr.send(null);
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
      edit.resize(width, height);
      const b64 = edit.toDataURL(mime);
      edit.destroy();
      return b64;
    })
  };
  const cut = () => {
    console.log('quick cut');
  };
  const rotate = () => {
    console.log('quick rotate');
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
