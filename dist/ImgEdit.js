(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.ImgEdit = {}));
}(this, function (exports) { 'use strict';

  const extReg = /\.(?:png|jpg|jpeg|gif|bmp)$/i;
  const data = {};
  function inputListener (e) {
    const reg = this.extReg || extReg;
    if (reg.test(e.target.files[0].name)) {
      this.img(e.target.files[0]);
    }
  }
  async function loadImg(src) {
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
                case 'file': this.listen(option.file);
                  break
                case 'extReg': this.extReg = option.extReg;
                  break;
              }
            }
          }
        }
      } else
        this.canvas = document.querySelector(option);
      if (!this.canvas || typeof this.canvas !== 'object' || !(this.canvas instanceof HTMLCanvasElement)) {
        data[this] = null;
        throw 'no canvas element'
      }
    }
    // 监听输入源(<input type=file>)变化
    listen (el) {
      data[this].inputListener = inputListener.bind(this);
      this.input = typeof el === 'object' && 'addEventListener' in el ? el : document.querySelector(el);
      this.input.addEventListener('change', data[this].inputListener);
    }
    // 删除输入源监听
    unlisten () {
      this.input.removeEventListener('change', data[this].inputListener);
    }
    // 图片资源/图片地址
    async img (file) {
      const img = await loadImg(file);
      const context = this.canvas.getContext('2d');
      context.drawImage(img, 0, 0);
    }
    destroy () {
      data[this] = null;
    }
  }

  // 输入源
  const input = () => {
    console.log('Hello world');
  };
  // 输出
  const output = () => {
    console.log('output');
  };

  exports.default = ImgEdit;
  exports.input = input;
  exports.output = output;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
