"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function querySelector(el) {
  if (_typeof(el) !== 'object') {
    return /^\w+$/.test(el) ? document.getElementById(el) : document.querySelector(el);
  } else if (el instanceof HTMLElement) return el;

  return null;
}

function getXY(deg, x, y) {
  var sin = Math.sin(deg);
  var cos = Math.cos(deg);
  return [x * cos + y * sin, y * cos - x * sin];
}

function getStartEnd(p4, p2) {
  p4 = p4.sort(function (a, b) {
    return a - b;
  });
  p2 = p2.sort(function (a, b) {
    return a - b;
  });
  var n1 = null,
      n3 = null;

  if (p4[3] > p2[0] && p2[1] > p4[0]) {
    n1 = p2[0] <= p4[0] ? p4[0] : p2[0];
    n3 = p2[1] <= p4[3] ? p2[1] : p4[3];
  }

  return [n1, n3];
}
/*
 * 图片资源
 */


var Sprite = /*#__PURE__*/function () {
  function Sprite(img, el) {
    var _this = this;

    _classCallCheck(this, Sprite);

    var src = null;
    var canvas = null;
    var sw = 0; // 源图裁剪宽度

    var sh = 0; // 源图裁剪高度

    var sx = 0; // 源图裁剪x轴位移

    var sy = 0; // 源图裁剪y轴位移

    var rx = 1; // 源图缩放x轴比率

    var ry = 1; // 源图缩放y轴比率

    var angle = 0; // 源图旋转角度

    var dx = 0; // 画布x轴起点

    var dy = 0; // 画布y轴起点

    var cw = 0; // 0角度时画布宽度

    var ch = 0; // 0角度时画布高度

    Object.defineProperties(this, {
      canvas: {
        /*
         * @description 设置canvas
         * @param {undefined|string|canvas} canvas元素（选择符）
         * @return {canvas|null}
         */
        set: function set(el) {
          canvas = querySelector(el);

          if (!canvas || !('getContext' in canvas)) {
            canvas = document.createElement('canvas');
          }

          if (src) {
            cw = sw * rx;
            ch = sh * ry;
            var n = angle % 180;
            var a = (n > 90 ? 180 - n : n) * (Math.PI / 180);
            var sin = Math.sin(a);
            var cos = Math.cos(a);
            canvas.width = cw * cos + ch * sin | 0;
            canvas.height = ch * cos + cw * sin | 0;
            draw();
          }
        }
      },
      src: {
        /*
         * @description 设置图像源（img，canvas）
         * @param {Image|canvas} img|canvas元素
         */
        set: function set(el) {
          if (el && (el instanceof Image || 'getContext' in el)) {
            src = el;
            dx = dy = sx = sy = angle = 0;
            rx = ry = 1;
            canvas.width = cw = sw = el.width;
            canvas.height = ch = sh = el.height;
            draw();
          }
        },

        /*
         * @description 返回已处理的canvas资源
         */
        get: function get() {
          return canvas;
        }
      },
      width: {
        get: function get() {
          return canvas.width;
        }
      },
      height: {
        get: function get() {
          return canvas.height;
        }
      },
      sw: {
        set: function set(n) {
          n = +n;

          if (n && n > 0) {
            sw = n;
          }
        },
        get: function get() {
          return sw;
        }
      },
      sh: {
        set: function set(n) {
          n = +n;

          if (n && n > 0) {
            sh = n;
          }
        },
        get: function get() {
          return sh;
        }
      },
      sx: {
        set: function set(n) {
          n = +n;

          if (!isNaN(n) && n >= 0) {
            sx = n;
          }
        },
        get: function get() {
          return sx;
        }
      },
      sy: {
        set: function set(n) {
          n = +n;

          if (!isNaN(n) && n >= 0) {
            sy = n;
          }
        },
        get: function get() {
          return sy;
        }
      },
      angle: {
        set: function set(n) {
          n = +n;

          if (!isNaN(n)) {
            angle = (360 + n) % 360;
          }
        },
        get: function get() {
          return angle;
        }
      },
      rx: {
        set: function set(n) {
          n = +n;

          if (n && n > 0) {
            rx = n;
          }
        },
        get: function get() {
          return rx;
        }
      },
      ry: {
        set: function set(n) {
          n = +n;

          if (n && n > 0) {
            ry = n;
          }
        },
        get: function get() {
          return ry;
        }
      },
      dx: {
        set: function set(n) {
          n = +n;

          if (!isNaN(n) && n >= 0) {
            dx = n;
          }
        },
        get: function get() {
          return dx;
        }
      },
      dy: {
        set: function set(n) {
          n = +n;

          if (!isNaN(n) && n >= 0) {
            dy = n;
          }
        },
        get: function get() {
          return dy;
        }
      },
      cw: {
        set: function set(n) {
          n = +n;

          if (n && n > 0) {
            cw = n;
          }
        },
        get: function get() {
          return cw;
        }
      },
      ch: {
        set: function set(n) {
          n = +n;

          if (n && n > 0) {
            ch = n;
          }
        },
        get: function get() {
          return ch;
        }
      }
    });

    function draw() {
      if (src) {
        var ctx = canvas.getContext('2d');
        var dw = sw * rx;
        var dh = sh * ry;
        var _canvas = canvas,
            width = _canvas.width,
            height = _canvas.height;
        var x = dx;
        var y = dy;
        canvas.height = height;
        ctx.save();

        if (angle) {
          ctx.translate(width / 2 | 0, height / 2 | 0);
          ctx.rotate(angle * Math.PI / 180);
          x -= dw * 0.5;
          y -= dh * 0.5;
        }

        ctx.drawImage(src, sx | 0, sy | 0, sw | 0, sh | 0, x | 0, y | 0, dw | 0, dh | 0);
        ctx.restore(); // console.log('sprite draw', angle, sx|0, sy|0, sw|0, sh|0, x|0, y|0, dw|0, dh|0);
      }
    }

    this.toJSON = function () {
      return {
        sw: sw,
        sh: sh,
        sx: sx,
        sy: sy,
        angle: angle,
        rx: rx,
        ry: ry,
        dx: dx,
        dy: dy,
        cw: cw,
        ch: ch
      };
    };

    this.fromJSON = function (json) {
      for (var k in json) {
        if (typeof _this[k] !== 'undefined') {
          _this[k] = json[k];
        }

        var n = angle % 180;
        var a = (n > 90 ? 180 - n : n) * (Math.PI / 180);
        var sin = Math.sin(a);
        var cos = Math.cos(a);
        canvas.width = cw * cos + ch * sin | 0;
        canvas.height = ch * cos + cw * sin | 0;
      }

      draw();
    };
    /*
     * @description 设置宽高（canvas）
     * @param {number} 宽度
     * @param {number} 高度
     */


    this.resize = function () {
      if (src) {
        var _canvas2 = canvas,
            width = _canvas2.width,
            height = _canvas2.height;
        var cWidth = 0;
        var cHeight = 0;

        if (arguments.length) {
          var w = +(arguments.length <= 0 ? undefined : arguments[0]);
          var h = arguments.length > 1 ? +(arguments.length <= 1 ? undefined : arguments[1]) : 0;
          var ratio = width / height;

          if (w && h) {
            cWidth = w;
            cHeight = h;
          } else if (w) {
            cWidth = w;
            cHeight = w / ratio;
          } else if (h) {
            cWidth = h * ratio;
            cHeight = h;
          }

          var rw = cWidth / width;
          var rh = cHeight / height;
          rx *= rw;
          ry *= rh;
          cw *= rw;
          ch *= rh;
        } else {
          var n = angle % 180;
          var a = (n > 90 ? 180 - n : n) * (Math.PI / 180);
          var sin = Math.sin(a);
          var cos = Math.cos(a);
          cw = sw * rx;
          ch = sh * ry;
          cWidth = cw * cos + ch * sin;
          cHeight = ch * cos + cw * sin;
        }

        canvas.width = cWidth | 0;
        canvas.height = cHeight | 0; // const a = Math.abs((angle % 90) * (Math.PI / 180));
        // dw *= (canvas.width / Math.cos(a) - canvas.height * Math.tan(a) / Math.cos(a)) / (1 + Math.tan(a) * Math.tan(a));

        draw();
      }

      return _this;
    };
    /*
     * @description 裁剪
     * @param {number} 宽度
     * @param {number} 高度
     * @param {number} x坐标
     * @param {number} y坐标
     */


    this.crop = function () {
      if (src && arguments.length) {
        var width = +(arguments.length <= 0 ? undefined : arguments[0]);
        var height = arguments.length > 1 ? +(arguments.length <= 1 ? undefined : arguments[1]) : canvas.height;
        var x = arguments.length > 2 ? +(arguments.length <= 2 ? undefined : arguments[2]) : 0;
        var y = arguments.length > 3 ? +(arguments.length <= 3 ? undefined : arguments[3]) : 0;
        var srcWidth = sw * rx;
        var srcHeight = sh * ry; // 获取图像4个顶点位置（左上，右上，右下，左下）

        var deg = 0;

        if (angle % 90) {
          // 0 ~ 90, 180 ~ 270
          if (angle < 90 || angle > 180 && angle < 270) {
            deg = (angle - (angle > 180 ? 180 : 0)) * (Math.PI / 180);
          } else {
            // 90 ~ 180, 270 ~ 360
            deg = (angle - (angle > 270 ? 270 : 90)) * (Math.PI / 180);
            var _ref = [srcHeight, srcWidth];
            srcWidth = _ref[0];
            srcHeight = _ref[1];
          }
        } else if (angle === 90 || angle === 270) {
          var _ref2 = [srcHeight, srcWidth];
          srcWidth = _ref2[0];
          srcHeight = _ref2[1];
        }

        var sin = Math.sin(deg);
        var cos = Math.cos(deg);
        var swSin = srcWidth * sin;
        var swCos = srcWidth * cos;
        var shSin = srcHeight * sin;
        var shCos = srcHeight * cos;
        var _canvas3 = canvas,
            canvasWidth = _canvas3.width,
            canvasHeight = _canvas3.height;

        var _getXY = getXY(deg, shSin, 0),
            _getXY2 = _slicedToArray(_getXY, 2),
            sx1 = _getXY2[0],
            sy1 = _getXY2[1];

        var _getXY3 = getXY(deg, canvasWidth, swSin),
            _getXY4 = _slicedToArray(_getXY3, 1),
            sx2 = _getXY4[0]; // const [ix3, iy3] = getXY(angle, iw * cos, canvas.height);


        var _getXY5 = getXY(deg, 0, shCos),
            _getXY6 = _slicedToArray(_getXY5, 2),
            sy4 = _getXY6[1]; // 旋转坐标，确定源图裁剪范围


        var _getXY7 = getXY(deg, x, y),
            _getXY8 = _slicedToArray(_getXY7, 2),
            x1 = _getXY8[0],
            y1 = _getXY8[1];

        var _getXY9 = getXY(deg, x + width, y),
            _getXY10 = _slicedToArray(_getXY9, 2),
            x2 = _getXY10[0],
            y2 = _getXY10[1];

        var _getXY11 = getXY(deg, x + width, y + height),
            _getXY12 = _slicedToArray(_getXY11, 2),
            x3 = _getXY12[0],
            y3 = _getXY12[1];

        var _getXY13 = getXY(deg, x, y + height),
            _getXY14 = _slicedToArray(_getXY13, 2),
            x4 = _getXY14[0],
            y4 = _getXY14[1];

        var _getStartEnd = getStartEnd([x1, x2, x3, x4], [sx1, sx2]),
            _getStartEnd2 = _slicedToArray(_getStartEnd, 2),
            nx1 = _getStartEnd2[0],
            nx3 = _getStartEnd2[1];

        var _getStartEnd3 = getStartEnd([y1, y2, y3, y4], [sy1, sy4]),
            _getStartEnd4 = _slicedToArray(_getStartEnd3, 2),
            ny1 = _getStartEnd4[0],
            ny3 = _getStartEnd4[1];

        if (nx1 === null || nx3 === null || ny1 === null || ny3 === null) {
          console.log('没有相交');
          return _this;
        }

        var newWidth = nx3 - nx1;
        var newHeight = ny3 - ny1;
        var dimx = 0;
        var dimy = 0;
        var cWidth = width;
        var cHeight = height;

        if (Math.round(newWidth) < Math.round(srcWidth) || Math.round(newHeight) < Math.round(srcHeight)) {
          // 裁剪canvas
          if (angle % 90) {
            // 确定4个相交点坐标
            var tan = Math.tan(deg);
            var _x = x;
            var _y = y;

            if (x2 < sx1) {
              var tmp = (shSin - x - width) / tan - y;
              cHeight -= tmp;
              _y += tmp; // console.log(`left裁剪高度 ${tmp}`, y, _y);
            }

            if (x4 < sx1) {
              var _tmp = (shCos - y - height) * tan - x;

              cWidth -= _tmp;
              _x += _tmp; // console.log(`left裁剪宽度 ${tmp}`, (ihCos - y - height) * tan, x);
            }

            if (x2 > sx2) {
              var _tmp2 = x + width - (canvasWidth - (y - swSin) * tan);

              cWidth -= _tmp2; // console.log(`right裁剪宽度 ${tmp}`);
            }

            if (x4 > sx2) {
              var _tmp3 = y + height - (canvasHeight - (x - swCos) / tan);

              cHeight -= _tmp3; // console.log(`right裁剪高度 ${tmp}`);
            }

            if (y1 < sy1) {
              var _tmp4 = (x - shSin) * tan - y;

              cHeight -= _tmp4;
              _y += _tmp4; // console.log(`top裁剪高度 ${tmp}`);
            }

            if (y3 < sy1) {
              var _tmp5 = x + width - (canvasWidth - (swSin - y - height) / tan);

              cWidth -= _tmp5; // console.log(`top裁剪宽度 ${tmp}`);
            }

            if (y1 > sy4) {
              var _tmp6 = (y - shCos) / tan - x;

              cWidth -= _tmp6;
              _x += _tmp6; // console.log(`bottom裁剪宽度 ${tmp}`);
            }

            if (y3 > sy4) {
              var _tmp7 = y + height - (shCos + (x + width) * tan);

              cHeight -= _tmp7; // console.log(`bottom裁剪高度 ${tmp}`);
            }

            var _getXY15 = getXY(deg, _x, _y);

            var _getXY16 = _slicedToArray(_getXY15, 2);

            x1 = _getXY16[0];
            y1 = _getXY16[1];

            var _getXY17 = getXY(deg, _x + cWidth, _y);

            var _getXY18 = _slicedToArray(_getXY17, 2);

            x2 = _getXY18[0];
            y2 = _getXY18[1];

            var _getXY19 = getXY(deg, _x + cWidth, _y + cHeight);

            var _getXY20 = _slicedToArray(_getXY19, 2);

            x3 = _getXY20[0];
            y3 = _getXY20[1];

            var _getXY21 = getXY(deg, _x, _y + cHeight);

            var _getXY22 = _slicedToArray(_getXY21, 2);

            x4 = _getXY22[0];
            y4 = _getXY22[1];

            var _getStartEnd5 = getStartEnd([x1, x2, x3, x4], [sx1, sx2]);

            var _getStartEnd6 = _slicedToArray(_getStartEnd5, 2);

            nx1 = _getStartEnd6[0];
            nx3 = _getStartEnd6[1];

            var _getStartEnd7 = getStartEnd([y1, y2, y3, y4], [sy1, sy4]);

            var _getStartEnd8 = _slicedToArray(_getStartEnd7, 2);

            ny1 = _getStartEnd8[0];
            ny3 = _getStartEnd8[1];
          } // 裁剪源图


          newWidth = nx3 - nx1;
          newHeight = ny3 - ny1;

          if (angle < 90) {
            sx += (nx1 - sx1) / rx;
            sy += (ny1 - sy1) / ry;

            if (newWidth < srcWidth || newHeight < srcHeight) {
              sw = newWidth / rx;
              sh = newHeight / ry;
            }
          } else if (angle < 180) {
            sx += (ny1 - sy1) / rx;
            sy += (srcWidth - (nx1 - sx1) - newWidth) / ry;

            if (newHeight < srcWidth || newWidth < srcHeight) {
              sw = newHeight / rx;
              sh = newWidth / ry;
            }
          } else if (angle < 270) {
            sx += (srcWidth - (nx1 - sx1) - newWidth) / rx;
            sy += (srcHeight - (ny1 - sy1) - newHeight) / ry;

            if (newWidth < srcWidth || newHeight < srcHeight) {
              sw = newWidth / rx;
              sh = newHeight / ry;
            }
          } else {
            sx += (srcHeight - (ny1 - sy1) - newHeight) / rx;
            sy += (nx1 - sx1) / ry;

            if (newHeight < srcWidth || newWidth < srcHeight) {
              sw = newHeight / rx;
              sh = newWidth / ry;
            }
          }
        }

        if (angle % 90) {
          if (angle < 90) {
            if (x1 < sx1) {
              // console.log('调整dx+')
              dimx += sx1 - x1;
            }

            if (x3 > sx2) {
              // console.log('调整dx-')
              dimx -= x3 - sx2;
            }

            if (y2 < sy1) {
              // console.log('调整dy+')
              dimy += sy1 - y2;
            }

            if (y4 > sy4) {
              // console.log('调整dy-')
              dimy -= y4 - sy4;
            }
          } else if (angle < 180) {
            if (x1 < sx1) {
              dimy -= sx1 - x1;
            }

            if (x3 > sx2) {
              dimy += x3 - sx2;
            }

            if (y2 < sy1) {
              dimx += sy1 - y2;
            }

            if (y4 > sy4) {
              dimx -= y4 - sy4;
            }
          } else if (angle < 270) {
            if (x1 < sx1) {
              dimx -= sx1 - x1;
            }

            if (x3 > sx2) {
              dimx += x3 - sx2;
            }

            if (y2 < sy1) {
              dimy -= sy1 - y2;
            }

            if (y4 > sy4) {
              dimy += y4 - sy4;
            }
          } else {
            if (x1 < sx1) {
              dimy += sx1 - x1;
            }

            if (x3 > sx2) {
              dimy -= x3 - sx2;
            }

            if (y2 < sy1) {
              dimx -= sy1 - y2;
            }

            if (y4 > sy4) {
              dimx += y4 - sy4;
            }
          }

          dx += dimx * 0.5;
          dy += dimy * 0.5;
          var n = angle % 180;
          var a = (n > 90 ? 180 - n : n) * (Math.PI / 180);

          var _sin = Math.sin(a);

          var _cos = Math.cos(a);

          var _tan = Math.tan(a);

          cw = (cWidth - cHeight * _tan) / (_cos - _sin * _tan);
          ch = (cHeight - cWidth * _tan) / (_cos - _sin * _tan);
        } else {
          cw = cWidth;
          ch = cHeight;
        }

        canvas.width = cWidth | 0;
        canvas.height = cHeight | 0;
        draw();
      }

      return _this;
    };
    /*
     * @description 旋转
     * @param {number} 角度
     */


    this.rotate = function (n) {
      if (src) {
        _this.angle = n;
        n = angle % 180;
        var a = (n > 90 ? 180 - n : n) * (Math.PI / 180);
        var sin = Math.sin(a);
        var cos = Math.cos(a);
        canvas.width = cw * cos + ch * sin | 0;
        canvas.height = ch * cos + cw * sin | 0;
        draw();
      }

      return _this;
    };

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


  _createClass(Sprite, [{
    key: "toDataURL",
    value: function toDataURL() {
      var _this2 = this;

      var mime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'image/jpeg';
      var quality = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : .8;
      return new Promise(function (resolve) {
        resolve(_this2.src.toDataURL(mime, quality));
      });
    }
    /*
     * @description 输出图像为blob
     * @param {string} mime
     * @param {number} quality
     * @return {Promise}
     */

  }, {
    key: "toBlob",
    value: function toBlob() {
      var _this3 = this;

      var mime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'image/jpeg';
      var quality = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : .8;
      return new Promise(function (resolve) {
        _this3.src.toBlob(function (blob) {
          resolve(blob);
        }, mime, quality);
      });
    }
    /*
     * @description 输出图像为file类型
     * @param {string} name
     * @param {string} mime
     * @param {number} quality
     * @return {Promise}
     */

  }, {
    key: "toFile",
    value: function toFile(name) {
      var _this4 = this;

      var mime = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'image/jpeg';
      var quality = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : .8;
      return new Promise(function (resolve) {
        _this4.src.toBlob(function (blob) {
          resolve(new File([blob], String(name), {
            type: mime,
            lastModified: Date.now()
          }));
        }, mime, quality);
      });
    }
  }]);

  return Sprite;
}();

exports["default"] = Sprite;