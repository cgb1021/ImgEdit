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
    let angle = 0; // 旋转角度
    let sw = 0; // 图像源裁剪宽度
    let sh = 0; // 图像源裁剪高度

    function draw() {
      if (src && canvas) {
        console.log('sprite draw')
        const ctx = canvas.getContext('2d');
        ctx.drawImage(src, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      }
    }
    Object.defineProperties(this, {
      canvas: {
        /*
         * @description 设置canvas
         * @param {undefined|string|canvas} el
         * @return {canvas|null}
         */
        set(el) {
          canvas = querySelector(el);
          if (!canvas || !('getContext' in canvas)) {
            canvas = document.createElement('canvas');
          }
          draw();
        },
        get() {
          return canvas;
        }
      },
      src: {
        /*
         * @description 设置图像源（img，canvas）
         * @param {Image|canvas} el
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
        get() {
          return src;
        }
      },
      sx: {
        set(n) {
          if (typeof n !== 'number' || n < 0) return;
          sx = n|0;
        },
        get() {
          return sx;
        }
      },
      sy: {
        set(n) {
          if (typeof n !== 'number' || n < 0) return;
          sy = n|0;
        },
        get() {
          return sy;
        }
      },
      sw: {
        set(n) {
          if (typeof n !== 'number' || n < 0) return;
          sw = n|0;
        },
        get() {
          return sw;
        }
      },
      sh: {
        set(n) {
          if (typeof n !== 'number' || n < 0) return;
          sh = n|0;
        },
        get() {
          return sh;
        }
      },
      angle: {
        set(n) {
          if (typeof n !== 'number' || n < 0) return;
          angle = n|0;
        },
        get() {
          return angle;
        }
      }
    })

    this.draw = draw;
    this.src = img;
    this.canvas = el;
  }
  /*
   * @description 设置宽高（canvas）
   * @param {number} w
   * @param {number} h
   */
  resize(w, h) {
    try {
      this.canvas.width = +w || this.sw || this.canvas.width;
      this.canvas.height = +h || this.sh || this.canvas.height;
    } catch (e) {}
    this.draw();
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
