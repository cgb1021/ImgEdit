import {
  querySelector
} from './Utils'
/*
 * 图片资源
 */
export default class Sprite {
  constructor(img, el) {
    let src = null;
    let canvas = null;
    let sw = 0; // 源图原始宽度（src.width）
    let sh = 0; // 源图原始高度（src.height）
    let angle = 0; // canvas中心点旋转角度
    let sx = 0; // canvas中心点偏移x轴
    let sy = 0; // canvas中心点偏移y轴
    let rx = 1; // canvas和src比率x轴
    let ry = 1; // canvas和src比率y轴

    function draw() {
      if (src && canvas) {
        const ctx = canvas.getContext('2d');
        const dw = sw * rx;
        const dh = sh * ry;
        const {
          width,
          height
        } = canvas;
        let dx = 0;
        let dy = 0;
        canvas.height = height;
        ctx.save();
        if (angle) {
          ctx.translate((width / 2)|0, (height / 2)|0);
          ctx.rotate((angle * Math.PI) / 180);
          dx -= dw * 0.5;
          dy -= dh * 0.5;
        }
        ctx.drawImage(src, sx|0, sy|0, sw|0, sh|0, dx|0, dy|0, dw|0, dh|0);
        ctx.restore();
        // console.log('sprite draw', angle, dx|0, dy|0, dw|0, dh|0);
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
          if (src) {
            canvas.width = sw;
            canvas.height = sh;
          }
          draw();
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
            sx = sy = angle = 0;
            rx = ry = 1;
            canvas.width = sw = el.width;
            canvas.height = sh = el.height;
            draw();
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
      sw: {
        get() {
          return sw;
        }
      },
      sh: {
        get() {
          return sh;
        }
      },
      angle: {
        set(n) {
          n = +n;
          if (!isNaN(n)) {
            angle = (360 + n) % 360;
          }
        },
        get() {
          return angle;
        }
      },
      sx: {
        set(n) {
          n = +n;
          if (!isNaN(n)) {
            sx = n;
          }
        },
        get() {
          return sx;
        }
      },
      sy: {
        set(n) {
          n = +n;
          if (!isNaN(n)) {
            sy = n;
          }
        },
        get() {
          return sy;
        }
      },
      rx: {
        set(n) {
          n = +n;
          if (n && n > 0) {
            rx = n;
          }
        },
        get() {
          return rx;
        }
      },
      ry: {
        set(n) {
          n = +n;
          if (n && n > 0) {
            ry = n;
          }
        },
        get() {
          return ry;
        }
      }
    })
    /*
     * @description 设置宽高（canvas）
     * @param {number} 宽度
     * @param {number} 高度
     */
    this.resize = (...args) => {
      if (!canvas || !src) return;
      const {
        width,
        height
      } = canvas;
      if (args.length) {
        const w = +args[0];
        const h = args.length > 1 ? +args[1] : 0;
        const ratio = width / height;
        if (w && h) {
          canvas.width = w|0;
          canvas.height = h|0;
        } else if (w) {
          canvas.width = w|0;
          canvas.height = (w / ratio)|0;
        } else if (h) {
          canvas.width = (h * ratio)|0;
          canvas.height = h|0;
        }
      } else {
        canvas.width = sw;
        canvas.height = sh;
      }
      // const a = Math.abs((angle % 90) * (Math.PI / 180));
      // dw *= (canvas.width / Math.cos(a) - canvas.height * Math.tan(a) / Math.cos(a)) / (1 + Math.tan(a) * Math.tan(a));
      rx *= canvas.width / width;
      ry *= canvas.height / height;
      draw();
    }
    /*
     * @description 裁剪
     * @param {number} 宽度
     * @param {number} 高度
     * @param {number} x坐标
     * @param {number} y坐标
     */
    this.crop = (...args) => {
      if (!canvas || !src || !args.length) return;
      const width = +args[0];
      const height = args.length > 1 ? +args[1] : canvas.height;
      const x = args.length > 2 ? +args[2] : 0;
      const y = args.length > 3 ? +args[3] : 0;
      /* const a = angle * (Math.PI / 180);
      const atan = Math.atan2(y, x);
      const len = x * Math.sin(atan); */
      canvas.width = width;
      canvas.height = height;
      sx += x / rx;
      sy += y / ry;
      sw = width / rx;
      sh = height / ry;
      // console.log('sprite crop', len / Math.sin(atan - a), len / Math.cos(atan - a), x, y, sx, sy);
      draw();
    }
    /*
     * @description 旋转
     * @param {number} 角度
     */
    this.rotate = (n) => {
      n = +n;
      if (isNaN(n) || !canvas || !src) return;
      const dw = sw * rx;
      const dh = sh * ry;
      angle = (360 + n) % 360;
      n = angle % 180;
      const a = (n > 90 ? 180 - n : n) * (Math.PI / 180);
      canvas.width = (dw * Math.cos(a) + dh * Math.sin(a))|0;
      canvas.height = (dh * Math.cos(a) + dw * Math.sin(a))|0;
      draw();
    }
    this.draw = draw;

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
    return this.src.toDataURL(mime, quality);
  }
  /*
   * @description 输出图像为blob
   * @param {string} mime
   * @param {number} quality
   * @return {Promise}
   */
  toBlob(mime = 'image/jpeg', quality = .8) {
    return this.src.toBlob(mime, quality);
  }
}