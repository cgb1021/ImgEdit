import { querySelector } from './Utils'
/*
 * 图片资源
 */
export default class Sprite {
  constructor(img, el) {
    let src = null;
    let canvas = null;
    let sx = 0; // 图像源裁剪起点x轴位置
    let sy = 0; // 图像源裁剪起点y轴位置
    let sw = 0; // 图像源裁剪宽度
    let sh = 0; // 图像源裁剪高度
    let angle = 0; // 旋转角度

    function draw() {
      if (src && canvas) {
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        canvas.height = height;
        ctx.drawImage(src, sx|0, sy|0, sw|0, sh|0, 0, 0, width, height);
      }
    }
    Object.defineProperties(this, {
      canvas: {
        /*
         * @description 设置canvas
         * @param {undefined|string|canvas} canvas元素（选择符）
         * @return {canvas|null}
         */
        set(el) {
          canvas = querySelector(el);
          if (!canvas || !('getContext' in canvas)) {
            canvas = document.createElement('canvas');
          }
          this.resize();
        }
      },
      src: {
        /*
         * @description 设置图像源（img，canvas）
         * @param {Image|canvas} img|canvas元素
         */
        set(el) {
          if (el && (el instanceof Image || 'getContext' in el)) {
            src = el;
            sx = 0; // 图像源裁剪起点x轴位置
            sy = 0; // 图像源裁剪起点y轴位置
            angle = 0; // 旋转角度
            sw = el.width; // 图像源裁剪宽度
            sh = el.height; // 图像源裁剪高度
            this.resize();
          }
        },
        /*
         * @description 返回已处理的canvas资源
         */
        get() {
          return canvas;
        }
      },
      width: {
        get() {
          return canvas.width;
        }
      },
      height: {
        get() {
          return canvas.height;
        }
      },
      sx: {
        get() {
          return sx|0;
        }
      },
      sy: {
        get() {
          return sy|0;
        }
      },
      sw: {
        get() {
          return sw|0;
        }
      },
      sh: {
        get() {
          return sh|0;
        }
      },
      angle: {
        get() {
          return angle|0;
        }
      }
    })
    /*
    * @description 设置宽高（canvas）
    * @param {number} 宽度
    * @param {number} 高度
    */
    this.resize = (w, h) => {
      canvas.width = +w || sw || canvas.width;
      canvas.height = +h || sh || canvas.height;
      draw();
    }
    /*
     * @description 裁剪
     * @param {number} 宽度
     * @param {number} 高度
     * @param {number} x坐标
     * @param {number} y坐标
     */
    this.cut = (...args) => {
      const len = Math.min(4, args.length);
      for (let i = 0; i < len; i++) {
        const n = args[i];
        if (typeof n !== 'number' || n < 0) return;
        switch (n) {
          case 0: sx = n;
            break;
          case 1: sy = n;
            break;
          case 2: sw = src ? Math.min(src.width, n) : n;
            break;
          case 3: sh = src ? Math.min(src.width, n) : n;
            break;
        }
      }
      draw();
    }
    /*
     * @description 旋转
     * @param {number} 角度
     * @param {number} 高度
     * @param {number} x坐标
     * @param {number} y坐标
     */
    this.rotate = (n) => {
      if (typeof n !== 'number' || n < 0) return;
      angle = (n < 0 ? 360 + n : n) % 360;
      draw();
    }

    this.src = img;
    this.canvas = el;
    img = el = null;
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
