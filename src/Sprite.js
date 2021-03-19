import {
  querySelector
} from './Utils'

function getXY(angle, x, y) {
  const sin = Math.sin(angle * (Math.PI / 180));
  const cos = Math.cos(angle * (Math.PI / 180));

  return [x * cos + y * sin, y * cos - x * sin];
}
function getStartEnd(p4, p2) {
  p4 = p4.sort((a, b) => a - b);
  p2 = p2.sort((a, b) => a - b);
  let n1 = null, n3 = null;
  if (p4[3] > p2[0] && p2[1] > p4[0]) {
    n1 = p2[0] <= p4[0] ? p4[0] : p2[0];
    n3 = p2[1] <= p4[3] ? p2[1] : p4[3];
  }
  return [n1, n3];
}
/*
 * 图片资源
 */
export default class Sprite {
  constructor(img, el) {
    let src = null;
    let canvas = null;
    let sw = 0; // 源图裁剪宽度
    let sh = 0; // 源图裁剪高度
    let sx = 0; // 源图裁剪位移x轴
    let sy = 0; // 源图裁剪位移y轴
    let angle = 0; // canvas中心点旋转角度
    let rx = 1; // canvas和src比率x轴
    let ry = 1; // canvas和src比率y轴
    let dx = 0;
    let dy = 0;

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
    function draw() {
      if (src) {
        const ctx = canvas.getContext('2d');
        const dw = sw * rx;
        const dh = sh * ry;
        const {
          width,
          height
        } = canvas;
        let x = dx;
        let y = dy;
        canvas.height = height;
        ctx.save();
        if (angle) {
          ctx.translate((width / 2)|0, (height / 2)|0);
          ctx.rotate((angle * Math.PI) / 180);
          x -= dw * 0.5;
          y -= dh * 0.5;
        }
        ctx.drawImage(src, sx|0, sy|0, sw|0, sh|0, x|0, y|0, dw|0, dh|0);
        ctx.restore();
        // console.log('sprite draw', sx|0, sy|0, sw|0, sh|0, x|0, y|0, dw|0, dh|0);
      } else {
        console.log('no src')
      }
    }
    /*
     * @description 设置宽高（canvas）
     * @param {number} 宽度
     * @param {number} 高度
     */
    this.resize = (...args) => {
      if (src) {
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
      return this;
    }
    /*
     * @description 裁剪
     * @param {number} 宽度
     * @param {number} 高度
     * @param {number} x坐标
     * @param {number} y坐标
     */
    this.crop = (...args) => {
      if (src && args.length) {
        let width = +args[0];
        let height = args.length > 1 ? +args[1] : canvas.height;
        const x = args.length > 2 ? +args[2] : 0;
        const y = args.length > 3 ? +args[3] : 0;
        const sin = Math.sin(angle * (Math.PI / 180));
        const cos = Math.cos(angle * (Math.PI / 180));
        const iw = sw * rx;
        const ih = sh * ry;
        const iwSin = iw * sin;
        const iwCos = iw * cos;
        const ihSin = ih * sin;
        const ihCos = ih * cos;
        const { width: cw, height: ch } = canvas;
        // 旋转坐标，确定源图裁剪范围
        let [x1, y1] = getXY(angle, x, y);
        let [x2, y2] = getXY(angle, x + width, y);
        let [x3, y3] = getXY(angle, x + width, y + height);
        let [x4, y4] = getXY(angle, x, y + height);
        const [ix1, iy1] = getXY(angle, ihSin, 0);
        const [ix2] = getXY(angle, cw, iwSin);
        // const [ix3, iy3] = getXY(angle, iw * cos, canvas.height);
        const [, iy4] = getXY(angle, 0, ihCos);
        const [nx1, nx3] = getStartEnd([x1, x2, x3, x4], [ix1, ix2]);
        const [ny1, ny3] = getStartEnd([y1, y2, y3, y4], [iy1, iy4]);
        if (nx1 === null || nx3 === null || ny1 === null || ny3 === null) {
          console.log('没有相交')
          return this;
        }
        const nw = nx3 - nx1;
        const nh = ny3 - ny1;
        let dimx = 0;
        let dimy = 0;
        if (Math.round(nw) < Math.round(iw) || Math.round(nh) < Math.round(ih)) {
          // 裁剪canvas
          if (angle % 90) {
            // 确定4个相交点坐标
            const tan = Math.tan(angle * (Math.PI / 180));
            let _x = x;
            let _y = y;
            if (x2 < ix1) {
              const tmp = (ihSin - x - width) / tan - y;
              height -= tmp;
              _y += tmp;
              // console.log(`left裁剪高度 ${tmp}`, y, _y);
            }
            if (x4 < ix1) {
              const tmp = (ihCos - y - height) * tan - x;
              width -= tmp;
              _x += tmp;
              // console.log(`left裁剪宽度 ${tmp}`);
            }
            if (x2 > ix2) {
              const tmp = x + width - (cw - (y - iwSin) * tan);
              width -= tmp;
              // console.log(`right裁剪宽度 ${tmp}`);
            }
            if (x4 > ix2) {
              const tmp = y + height - (ch - (x - iwCos) / tan);
              height -= tmp;
              // console.log(`right裁剪高度 ${tmp}`);
            }
            if (y1 < iy1) {
              const tmp = (x - ihSin) * tan - y;
              height -= tmp;
              _y += tmp;
              // console.log(`top裁剪高度 ${tmp}`);
            }
            if (y3 < iy1) {
              const tmp = x + width - (cw - (iwSin - y - height) / tan);
              width -= tmp;
              // console.log(`top裁剪宽度 ${tmp}`);
            }
            if (y1 > iy4) {
              const tmp = (y - ihCos) / tan - x;
              width -= tmp;
              _x += tmp;
              // console.log(`bottom裁剪宽度 ${tmp}`);
            }
            if (y3 > iy4) {
              const tmp = y + height - (ihCos + (x + width) * tan);
              height -= tmp;
              // console.log(`bottom裁剪高度 ${tmp}`);
            }
            [x1, y1] = getXY(angle, _x, _y);
            [x2, y2] = getXY(angle, _x + width, _y);
            [x3, y3] = getXY(angle, _x + width, _y + height);
            [x4, y4] = getXY(angle, _x, _y + height);
          }
          // 裁剪源图
          sx += (nx1 - ix1) / rx;
          sy += (ny1 - iy1) / ry;
          if (nw < iw || nh < ih) {
            sw = nw / rx;
            sh = nh / ry;
          }
        }
        if (x1 < ix1) {
          // console.log('调整dx')
          dimx += ix1 - x1;
        }
        if (x3 > ix2) {
          // console.log('调整dx')
          dimx -= x3 - ix2;
        }
        if (y2 < iy1) {
          // console.log('调整dy')
          dimy += iy1 - y2;
        }
        if (y4 > iy4) {
          // console.log('调整dy')
          dimy -= y4 - iy4;
        }
        dx += dimx * 0.5;
        dy += dimy * 0.5;
        canvas.width = width|0;
        canvas.height = height|0;
        draw();
      }
      return this;
    }
    /*
     * @description 旋转
     * @param {number} 角度
     */
    this.rotate = (n) => {
      n = +n;
      if (!isNaN(n) && src) {
        const dw = sw * rx;
        const dh = sh * ry;
        angle = (360 + n) % 360;
        n = angle % 180;
        const a = (n > 90 ? 180 - n : n) * (Math.PI / 180);
        canvas.width = (dw * Math.cos(a) + dh * Math.sin(a))|0;
        canvas.height = (dh * Math.cos(a) + dw * Math.sin(a))|0;
        draw();
      }
      return this;
    }

    this.draw = draw;
    this.src = img;
    this.canvas = el;
    img = el = null;
  }
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