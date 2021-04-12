"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Sprite = _interopRequireDefault(require("./Sprite"));

var _Utils = require("./Utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function querySelector(el) {
  if (_typeof(el) !== 'object') {
    return /^\w+$/.test(el) ? document.getElementById(el) : document.querySelector(el);
  } else if (el instanceof HTMLElement) return el;

  return null;
} // 移动事件


var eventData = {
  active: false,
  // 点击事件开始标记
  offsetX: 0,
  // 点击事件开始x轴位置
  offsetY: 0,
  // 点击事件开始y轴位置
  ctrlKey: false // ctrl键按下标记

};

function moveEvent(e) {
  e.preventDefault();
  e.stopPropagation();
  var _this$view = this.view,
      x = _this$view.x,
      y = _this$view.y,
      ratio = _this$view.ratio;
  var _this$src = this.src,
      width = _this$src.width,
      height = _this$src.height;

  switch (e.type) {
    case 'mousedown':
      eventData.ctrlKey = e.ctrlKey;
      eventData.offsetX = e.offsetX;
      eventData.offsetY = e.offsetY;

      if (!eventData.ctrlKey && e.offsetX > x && e.offsetY > y && e.offsetX < x + width * ratio && e.offsetY < y + height * ratio) {
        // 在图片范围内
        eventData.active = true;
        eventData.offsetX = e.offsetX - x;
        eventData.offsetY = e.offsetY - y;
      }

      break;

    case 'mouseout':
    case 'mouseup':
      eventData.active = false;
      eventData.ctrlKey = false;
      break;

    case 'mousemove':
      if (eventData.ctrlKey) {
        var _x = Math.min(e.offsetX, eventData.offsetX);

        var _y = Math.min(e.offsetY, eventData.offsetY);

        var _width = Math.max(e.offsetX, eventData.offsetX) - _x;

        var _height = Math.max(e.offsetY, eventData.offsetY) - _y;

        this.range = {
          width: _width,
          height: _height,
          x: _x,
          y: _y
        };
      } else if (eventData.active) {
        this.view = {
          x: e.offsetX - eventData.offsetX,
          y: e.offsetY - eventData.offsetY
        };
      }

      break;

    case 'mousewheel':
      var direct = e.wheelDelta ? e.wheelDelta > 0 ? 0 : 1 : e.detail > 0 ? 0 : 1; // 0 上(缩小，scale变小) 1 下(放大，scale变大)

      eventData.offsetX = e.offsetX;
      eventData.offsetY = e.offsetY;
      this.scale(ratio + (direct ? 0.1 : -0.1), 1);
      break;
  }
}
/*
 * 图片编辑器
 * 输入，输出，编辑，辅助
 */


var Editor = /*#__PURE__*/function () {
  function Editor(el) {
    var _this = this;

    _classCallCheck(this, Editor);

    var sprite = new _Sprite["default"]();
    var event = moveEvent.bind(this);
    var eventNames = ['mousewheel', 'mousedown', 'mouseup', 'mouseout', 'mousemove'];
    var history = []; // 操作步骤（state）集合

    var state = {
      width: 0,
      height: 0,
      angle: 0,
      rx: 1,
      ry: 1
    };
    var view = {
      ratio: 1,
      x: 0,
      y: 0
    };
    var range = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    }; // 矩形选择框数据（左上角为原点）

    var rects = [];
    var historyIndex = 0; // 操作步骤index

    var canvas = null;
    var lineWidth = 1;
    Object.defineProperties(this, {
      historyIndex: {
        set: function set(val) {
          if (typeof val !== 'number' || val === historyIndex) return;
          historyIndex = Math.max(0, Math.min(history.length - 1, val));
        },
        get: function get() {
          return historyIndex;
        }
      },
      state: {
        get: function get() {
          return history.length ? history[historyIndex] : Object.assign({}, state);
        }
      },
      view: {
        set: function set(obj) {
          if (obj && _typeof(obj) === 'object') {
            Object.assign(view, obj);
            stateChange();
            this.draw();
          }
        },
        get: function get() {
          return view;
        }
      },
      range: {
        set: function set(obj) {
          if (obj && _typeof(obj) === 'object') {
            Object.assign(range, obj);
            stateChange();
            this.draw();
          }
        },
        get: function get() {
          return range;
        }
      },
      canvas: {
        set: function set(el) {
          this.destroy();
          canvas = querySelector(el);

          if (canvas && 'getContext' in canvas) {
            eventNames.forEach(function (name) {
              canvas.addEventListener(name, event, false);
            });
          } else {
            canvas = null;
          }
        },
        get: function get() {
          return canvas;
        }
      },
      src: {
        get: function get() {
          return sprite.src;
        }
      }
    });
    /*
     * 更新sprite/触发onchange
     */

    var stateChange = function stateChange(obj) {
      var state = _this.state;

      if (typeof _this.onChange === 'function') {
        _this.onChange(Object.assign({}, state, view, {
          range: range
        }, obj));
      }

      return Object.assign({}, state, obj);
    };
    /*
     * 推入一个状态
     */


    this.push = function (obj) {
      if (!obj || _typeof(obj) !== 'object') return;

      if (history.length && historyIndex !== history.length - 1) {
        history.splice(historyIndex + 1);
      }

      history.push(stateChange(obj));
      historyIndex = history.length - 1;

      _this.draw();
    };
    /*
     * 保存当前状态
     */


    this.save = function () {
      if (history.length < 2) return;
      var state = _this.state;
      historyIndex = 0;
      history.length = 0;
      history.push(state);
    };
    /*
     * 清理history
    */


    this.clean = function () {
      historyIndex = 0;
      history.length = 0;
    };

    this.draw = function () {
      if (!canvas) return;
      var context = canvas.getContext('2d');
      var src = sprite.src;
      var _this$view2 = _this.view,
          x = _this$view2.x,
          y = _this$view2.y,
          ratio = _this$view2.ratio;
      var _this$state = _this.state,
          width = _this$state.width,
          height = _this$state.height;

      for (var i = rects.length - 1; i >= 0; i--) {
        var _rects$i = rects[i],
            _x2 = _rects$i.x,
            _y2 = _rects$i.y,
            _width2 = _rects$i.width,
            _height2 = _rects$i.height;
        if (_width2 && _height2) context.clearRect(_x2 | 0, _y2 | 0, _width2 | 0, _height2 | 0);
      }

      if (typeof _this.before === 'function') _this.before(context);
      context.drawImage(src, x | 0, y | 0, width * ratio | 0, height * ratio | 0);
      rects[0] = {
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: Math.min(canvas.width, width * ratio),
        height: Math.min(canvas.height, height * ratio)
      };

      if (range.width && range.height) {
        context.setLineDash([5, 2]);
        context.strokeStyle = "black";
        context.lineWidth = lineWidth;
        context.strokeRect(range.x, range.y, range.width, range.height);
        rects[1] = {
          x: Math.max(0, range.x - lineWidth),
          y: Math.max(0, range.y - lineWidth),
          width: range.width + lineWidth * 2,
          height: range.height + lineWidth * 2
        };
      }

      if (typeof _this.after === 'function') _this.after(context); // console.log('editor draw', x|0, y|0, (width * ratio)|0, (height * ratio)|0);
    };
    /*
    * 异步打开图片
    * @param {object/string} file 图片资源(Image/base64/url)
    * @return {object} Promise
    */


    this.open = /*#__PURE__*/function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(file) {
        var img, _img, width, height, ratio, x, y;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(!canvas || !file)) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return");

              case 2:
                _context.prev = 2;

                if (!(file instanceof Image)) {
                  _context.next = 13;
                  break;
                }

                if (!/^blob:/.test(file.src)) {
                  _context.next = 8;
                  break;
                }

                img = file;
                _context.next = 11;
                break;

              case 8:
                _context.next = 10;
                return (0, _Utils.loadImg)(file.src);

              case 10:
                img = _context.sent;

              case 11:
                _context.next = 25;
                break;

              case 13:
                _context.t0 = _Utils.loadImg;

                if (!(_typeof(file) === 'object')) {
                  _context.next = 20;
                  break;
                }

                _context.next = 17;
                return (0, _Utils.readFile)(file);

              case 17:
                _context.t1 = _context.sent;
                _context.next = 21;
                break;

              case 20:
                _context.t1 = file;

              case 21:
                _context.t2 = _context.t1;
                _context.next = 24;
                return (0, _context.t0)(_context.t2);

              case 24:
                img = _context.sent;

              case 25:
                _context.next = 31;
                break;

              case 27:
                _context.prev = 27;
                _context.t3 = _context["catch"](2);
                console.log(_context.t3);
                return _context.abrupt("return");

              case 31:
                if (img) {
                  _context.next = 33;
                  break;
                }

                return _context.abrupt("return");

              case 33:
                sprite.src = img;
                _img = img, width = _img.width, height = _img.height;
                ratio = Math.min(1, Math.min(canvas.width / width, canvas.height / height));
                x = (canvas.width - width * ratio) / 2;
                y = (canvas.height - height * ratio) / 2;
                rects.length = 0;
                _this.view = {
                  ratio: ratio,
                  x: x,
                  y: y
                };

                _this.clean();

                _this.push({
                  width: width,
                  height: height,
                  sw: width,
                  sh: height
                });

              case 42:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, null, [[2, 27]]);
      }));

      return function (_x3) {
        return _ref.apply(this, arguments);
      };
    }();

    this.resize = function (width, height) {
      var _this$state2 = _this.state,
          sw = _this$state2.width,
          sh = _this$state2.height;
      var ratio = view.ratio;
      width = +width;
      height = +height;

      if (width && height) {
        ratio *= Math.min(sw / width, sh / height);
      } else if (width) {
        ratio *= sw / width;
        height = width / (sw / sh);
      } else if (height) {
        ratio *= sh / height;
        width = sw / sh * height;
      }

      _this.view = {
        ratio: ratio
      };
      sprite.resize(width, height);

      _this.push({
        width: width,
        height: height
      });
    };

    this.crop = function () {
      var rx = range.x,
          ry = range.y,
          rw = range.width,
          rh = range.height;
      var vx = view.x,
          vy = view.y,
          ratio = view.ratio;
      var _this$state3 = _this.state,
          sw = _this$state3.width,
          sh = _this$state3.height;
      sw *= ratio;
      sh *= ratio;
      _this.range = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };

      if (rw && rw && rx + rw > vx && ry + rh > vy && rx < vx + sw && ry < vy + sh) {
        // 选择范围和图片有交叉
        var x = Math.max(0, rx - vx);
        var y = Math.max(0, ry - vy);
        var width = Math.min(vx + sw, rx + rw) - Math.max(vx, rx);
        var height = Math.min(vy + sh, ry + rh) - Math.max(vy, ry);

        if (x <= vx && y <= vy && width >= sw && height >= sh) {
          // 截取整张图片
          return;
        }

        sprite.crop(width / ratio, height / ratio, x / ratio, y / ratio);
        Object.assign(view, {
          x: Math.max(rx, vx),
          y: Math.max(ry, vy)
        });

        _this.push({
          width: sprite.width,
          height: sprite.height,
          x: Math.max(rx, vx),
          y: Math.max(ry, vy)
        });
      }
    };

    this.rotate = function (angle) {
      sprite.rotate(angle);
      var width = sprite.width,
          height = sprite.height;

      _this.push({
        width: width,
        height: height,
        angle: sprite.angle
      });
    };

    this.toDataURL = function () {
      var mime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'image/jpeg';
      var quality = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : .8;
      return sprite.toDataURL(mime, quality);
    };

    this.toBlob = function () {
      var mime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'image/jpeg';
      var quality = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : .8;
      return sprite.toBlob(mime, quality);
    };

    this.destroy = function () {
      if (canvas) {
        eventNames.forEach(function (name) {
          canvas.removeEventListener(name, event);
        });
      }

      canvas = null;
    };

    this.canvas = el;
  }
  /*
   * 上一步操作
   */


  _createClass(Editor, [{
    key: "prev",
    value: function prev() {
      this.historyIndex = this.historyIndex - 1;
    }
    /*
     * 下一步操作
     */

  }, {
    key: "next",
    value: function next() {
      this.historyIndex = this.historyIndex + 1;
    }
    /*
     * 视图缩放
     */

  }, {
    key: "scale",
    value: function scale(r, wheel) {
      if (r < .1 || r > 10) {
        return;
      } // 放大比例不能小于1或大于10


      var view = this.view;
      var x = view.x,
          y = view.y,
          ratio = view.ratio;
      var _this$state4 = this.state,
          width = _this$state4.width,
          height = _this$state4.height;
      var diff = r - ratio;

      if (wheel && eventData.offsetX > x && eventData.offsetY > y && eventData.offsetX < x + width * ratio && eventData.offsetY < y + height * ratio) {
        // 在图片范围内，以鼠标位置为中心
        view.x -= (eventData.offsetX - x) / ratio * diff;
        view.y -= (eventData.offsetY - y) / ratio * diff;
      } else {
        // 以图片在画布范围内中心点
        view.x -= width * diff * 0.5;
        view.y -= height * diff * 0.5;
      }

      view.ratio = r;
      this.view = view;
    }
  }]);

  return Editor;
}();

exports["default"] = Editor;