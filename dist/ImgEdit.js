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
     dx: 0, // 原始坐标系统下的画图x轴位置
     dy: 0 // 原始坐标系统下的画图y轴位置
   };
   const fontSize = 12;
   const lineHeight = 1.2;
  /* 
   * 加载图片
   *
   * @param {string} src url/base64
   * @return {object} promise
   */
  function loadImg (src) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    return new Promise((res, rej) => {
      img.onload = function () {
        res(this);
      };
      img.onerror = function (e) {
        console.error('loadImg error', e);
        rej(e);
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
      fileReader.onload = (e) => {
        res(e.target.result);
      };
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
        eventData.offsetX = e.offsetX - eventData.dx;
        eventData.offsetY = e.offsetY - eventData.dy;
        break;
      case "mouseup":
        eventData.active = false;
        break;
      case "mousemove":
        if (eventData.active) {
          {
            eventData.dx = e.offsetX - eventData.offsetX;
            eventData.dy = e.offsetY - eventData.offsetY;
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
  function stateChange(data, type) {
    typeof data.stateChange === 'function' && data.stateChange(type);
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
  function drawRect (context, data) {
    let {
      rx,
      ry,
      rw,
      rh,
      dx,
      dy
    } = eventData;
    if (rw < 0) {
      rx += rw;
      rw = -rw;
    }
    if (rh < 0) {
      ry += rh;
      rh = -rh;
    }

    if (rw && rh) {
      const rt = data.scale / data.ratio / data.viewScale;

      context.setLineDash([5, 2]);
      context.strokeStyle = "black";
      context.lineWidth = 1;
      context.strokeRect(rx, ry, rw, rh);

      drawText(context, `${Math.floor((rx - dx) * rt)}, ${Math.floor((ry - dy) * rt)}`, rx, ry + fontSize * lineHeight);
      drawText(context, `${Math.floor(rw * rt)} x ${Math.floor(rh * rt)}`, rx + rw, ry + rh - fontSize * .5, 'right');
    }
  }
  /* 
   * 画图
   *
   * @param {string} img
   * @param {object} canvas
   */
  function dwaw (img, canvas, data) {
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
      if (!data.angle || data.angle === 1) {
        data.ratio = Math.min(
          canvas.width / data.width,
          canvas.height / data.height
        );
      } else {
        data.ratio = Math.min(
          canvas.width / data.height,
          canvas.height / data.width
        );
      }
      context.drawImage(img, 0, 0);
      // 画矩形选择框
      if (eventData.rw && eventData.rh) {
        drawRect(context, data);
        stateChange(data, 'range');
      }
    }
  }
  class ImgEdit {
    constructor (option) {
      data[this] = {
        x: 0, // 图片上的x轴位置
        y: 0, // 图片上的y轴位置
        width: 0, // 图片裁剪宽度
        height: 0, // 图片裁剪高度
        angle: 0, // 旋转角度
        scale: 1, // 裁剪时的缩放比例(和输出有关系)
        img: null, // new Image()
        ratio: 1, // 图片和canvas的高宽比例
        viewScale: 1, // 与画布的缩放比例（和显示有关系）
        offsetX: 0, // 坐标变换后事件x轴位置
        offsetY: 0 // 坐标变换后事件y轴位置
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
      this.draw(null, this.canvas);
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
            this.draw(e.target.files[0]);
          }
        };
      else {
        data[this].inputListener = (e) => {
          this.draw(e.target.files[0]);
        };
      }
      this.input = typeof el === 'object' && 'addEventListener' in el ? el : document.querySelector(el);
      this.input.addEventListener('change', data[this].inputListener);
      return this
    }
    // 删除输入源监听
    unlisten () {
      this.input && this.input.removeEventListener('change', data[this].inputListener);
      return this
    }
    /*
     * @param {string/object} file 图片资源(base64)/图片地址
     * @return {object} Promise
     */
    async open (file) {
      const d = data[this];
      d.img = await loadImg(file instanceof Image ? file.src : (typeof file === 'object' ? await readFile(file) : file));
      d.width = d.img.width;
      d.height = d.img.height;
      return this
    }
    draw () {
      dwaw(data[this].img, this.canvas, data[this]);
      return this
    }
    toDataURL (mime) {
      return this.canvas.toDataURL(mime ? mime : 'image/jpeg')
    }
    toBlob () {
      console.log('toBlob');
    }
    width () {
      return data[this].width
    }
    height () {
      return data[this].height
    }
    resize () {
      console.log('resize');
    }
    scale () {
      console.log('scale');
    }
  }

  exports.default = ImgEdit;
  exports.loadImg = loadImg;
  exports.readFile = readFile;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
