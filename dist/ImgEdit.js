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
     rx: 0, // 原始坐标系统下的矩形选择框x轴位置
     ry: 0, // 原始坐标系统下的矩形选择框y轴位置
     rw: 0, // 原始坐标系统下的矩形选择框宽度
     rh: 0, // 原始坐标系统下的矩形选择框高度
     cx: 0, // 原始坐标系统下的画图x轴位置
     cy: 0 // 原始坐标系统下的画图y轴位置
   };
   const range = {
     rx: 0,
     ry: 0,
     rw: 0,
     rh: 0
   }; // 坐标变换后的矩形选择框数据
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
        const state = data[this];

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
    typeof state.onChange && state.onChange(type, state);
  }
  // 设置对齐
  function align(pos, canvas, state) {
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
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    // 画背景
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
          [range.rx, range.ry, range.rw, range.rh] = [eventData.ry, canvas.width - eventData.rx - eventData.rw, eventData.rh, eventData.rw];
          break;
        case 1.5: // 逆时针90°
          state.cx = canvas.height - eventData.cy - sWidth;
          state.cy = eventData.cx;
          [range.rx, range.ry, range.rw, range.rh] = [canvas.height - eventData.ry - eventData.rh, eventData.rx, eventData.rh, eventData.rw];
          break;
        case 1: // 180°
          state.cx = canvas.width - eventData.cx - sWidth;
          state.cy = canvas.height - eventData.cy - sHeight;
          [range.rx, range.ry, range.rw, range.rh] = [canvas.width - eventData.rx - eventData.rw, canvas.height - eventData.ry - eventData.rh, eventData.rw, eventData.rh];
          break;
        default: // 0°
          state.cx = eventData.cx;
          state.cy = eventData.cy;
          [range.rx, range.ry, range.rw, range.rh] = [eventData.rx, eventData.ry, eventData.rw, eventData.rh];
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
      data[this] = {
        img: null, // new Image()
        width: 0, // 图片裁剪范围宽度
        height: 0, // 图片裁剪范围高度
        x: 0, // 图片上的x轴位置
        y: 0, // 图片上的y轴位置
        angle: 0, // 旋转角度
        scale: 1, // 裁剪时的缩放比例(和输出有关系)
        ratio: 1, // 图片和画布的高宽比例
        viewScale: 1, // 与画布的缩放比例（和显示有关系）
        offsetX: 0, // 坐标变换后事件x轴位置
        offsetY: 0, // 坐标变换后事件y轴位置
        cx: null, // 坐标变换后画图x轴位置（画布上）
        cy: null // 坐标变换后画图y轴位置（画布上）
      };
      // 获取canvas元素
      if (typeof option === 'object') {
        if (option instanceof HTMLCanvasElement)
          this.canvas = option;
        else {
          this.canvas = typeof option.canvas === 'string' ? document.querySelector(option.canvas) : option.canvas;
          if (this.canvas) {
            for (const k in option) {
              switch (k) {
                case 'width':
                  this.canvas.width = option.width;
                  break
                case 'height':
                  this.canvas.height = option.height;
                  break
                case 'input': this.listen(option.input, option.inputListener);
                  break
              }
            }
          }
        }
      } else
        this.canvas = document.querySelector(option);
      const event = moveEvent.bind(this);
      this.canvas.addEventListener("mousewheel", event, false);
      this.canvas.addEventListener("mousedown", event, false);
      this.canvas.addEventListener("mouseup", event, false);
      this.canvas.addEventListener("mousemove", event, false);
      data[this].moveEvent = event;
      draw(null, this.canvas);
    }
    reset() {
      const state = data[this];
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
      this.canvas.removeEventListener("mousewheel", data[this].moveEvent, false);
      this.canvas.removeEventListener("mousedown", data[this].moveEvent, false);
      this.canvas.removeEventListener("mouseup", data[this].moveEvent, false);
      this.canvas.removeEventListener("mousemove", data[this].moveEvent, false);
      data[this] = this.input = this.canvas = null;
    }
    // 监听输入源(<input type=file>)变化
    listen (el, hook) {
      if (typeof hook === 'function')
        data[this].inputListener = (e) => {
          const res = hook(e);
          if (res === undefined$1 || res) {
            this.open(e.target.files[0]).then(() => {
              this.draw();
            });
          }
        };
      else {
        data[this].inputListener = (e) => {
          this.open(e.target.files[0]).then(() => {
            this.draw();
          });
        };
      }
      this.input = typeof el === 'object' && 'addEventListener' in el ? el : document.querySelector(el);
      this.input.addEventListener('change', data[this].inputListener);
      return this;
    }
    // 删除输入源监听
    unlisten () {
      this.input && this.input.removeEventListener('change', data[this].inputListener);
      return this;
    }
    onChange (fn) {
      data[this].onChange = typeof fn === 'function' ? fn : null;
      return this;
    }
    /*
     * 异步打开图片
     * @param {object/string} file 图片资源(Image/base64/url)
     * @return {object} Promise
     */
    async open (file) {
      const state = data[this];
      state.img = await loadImg(file instanceof Image ? file.src : (typeof file === 'object' ? await readFile(file) : file));
      state.width = state.img.width;
      state.height = state.img.height;
      this.reset();
      return this;
    }
    draw () {
      draw(data[this].img, this.canvas, data[this]);
      return this;
    }
    toDataURL (mime) {
      return this.canvas.toDataURL(mime ? mime : 'image/jpeg');
    }
    toBlob () {
      console.log('toBlob');
    }
    // 清理选择矩形
    clean () {
      console.log('clean');
    }
    // 获取图片宽度
    width () {
      return data[this].width;
    }
    // 获取图片高度
    height () {
      return data[this].height;
    }
    // 视图缩放
    scale () {
      console.log('scale');
    }
    // 裁剪
    cut () {
      console.log('cut');
    }
    // 调整大小
    resize (width, height) {
      const state = data[this];
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
    rotate () {
      console.log('rotate');
    }
  }

  const resize = () => {
    console.log('quick resize');
  };
  const cut = () => {
    console.log('quick cut');
  };

  exports.cut = cut;
  exports.default = ImgEdit;
  exports.loadImg = loadImg;
  exports.readFile = readFile;
  exports.resize = resize;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
