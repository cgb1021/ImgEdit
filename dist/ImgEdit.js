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
  /* 
   * 画矩形选择框
   */
  function drawRect () {
    drawText('drawRect');
  }
  /*
   * 画文字
   */
  function drawText(str, x, y, align = 'left') {
    console.log(str, x, y, align);
  }
  /* 
   * 画图
   *
   * @param {string} base64
   * @param {object} context
   */
  function dwaw (base64, context) {
    drawRect();
    context.drawImage(base64, 0, 0);
  }
  class ImgEdit {
    constructor (option) {
      data[this] = {};
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
    }
    destroy () {
      this.unlisten();
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
    }
    // 删除输入源监听
    unlisten () {
      this.input && this.input.removeEventListener('change', data[this].inputListener);
    }
    // 图片资源(base64)/图片地址
    async draw (file) {
      const img = file instanceof HTMLImageElement
        ? file
        : (await loadImg(typeof file === 'object'
          ? await readFile(file)
          : file));
      dwaw(img, this.canvas.getContext('2d'));
    }
    toDataURL (mime) {
      return this.canvas.toDataURL(mime ? mime : 'image/jpeg')
    }
    toBlob () {
      console.log('toBlob');
    }
    resize () {
      console.log('resize');
    }
  }

  exports.default = ImgEdit;
  exports.loadImg = loadImg;
  exports.readFile = readFile;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
