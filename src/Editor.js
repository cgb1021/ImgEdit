import Sprite from './Sprite'
import { querySelector, loadImg, readFile } from './Utils'
const state = {
  viewRatio: 0,
  range: {
    x: 0, // 选择范围（setRange）在图片上的x轴位置（原始坐标系统）
    y: 0, // 选择范围（setRange）在图片上的y轴位置（原始坐标系统）
    width: 0, // 选择范围（cut）宽度（原始坐标系统）
    height: 0 // 选择范围（cut）高度（原始坐标系统）
  } // 矩形选择框数据（左上角为原点）
};
// 移动事件
function moveEvent(e) {
  e.preventDefault();
  e.stopPropagation();
  const state = this._state;
  const sprite = this.sprite;
  console.log(state, sprite)
}
/*
 * 图片编辑器
 * 输入，输出，编辑，辅助
 */
export default class Editor {
  constructor(el) {
    this._state = Object.assign({}, state); // 当前状态

    const sprite = new Sprite();
    const _history = []; // 操作步骤（state）集合
    const event = moveEvent.bind(this);
    const eventNames = ['mousewheel', 'mousedown', 'mouseup', 'mouseout', 'mousemove'];
    let historyIndex = 0; // 操作步骤index
    let canvas = null;

    Object.defineProperties(this, {
      historyIndex: {
        set(val) {
          if (typeof val !== 'number') return;
          historyIndex = Math.max(0, Math.min(_history.length - 1, val));
          if (_history.length) {
            this._state = Object.assign({}, _history[historyIndex]);
          }
        },
        get() {
          return historyIndex;
        }
      },
      canvas: {
        set(el) {
          if (canvas) {
            eventNames.forEach((name) => {
              canvas.removeEventListener(name, event, false);
            })
          }
          canvas = querySelector(el);
          if (canvas && 'getContext' in canvas) {
            eventNames.forEach((name) => {
              canvas.addEventListener(name, event, false);
            })
          }
        },
        get() {
          return canvas;
        }
      },
      src: {
        set(src) {
          sprite.src = src;
        },
        get() {
          return sprite.src;
        }
      },
      sprite: {
        get() {
          return sprite;
        }
      }
    })
    this.canvas = el;
    this.destroy =  () => {
      if (canvas && 'getContext' in canvas) {
        eventNames.forEach((name) => {
          this.canvas.removeEventListener(name, event);
        })
      }
    }
  }
  /*
   * 上一步操作
   */
  prev() {
    this.historyIndex = this.historyIndex - 1;
  }
  /*
   * 下一步操作
   */
  next() {
    this.historyIndex = this.historyIndex + 1;
  }
  /*
   * 保存状态（清理history）
   */
  save() {
    const state = this._history[this.historyIndex];
    this.historyIndex = 0;
    if (state) {
      this._history.length = 0;
      this._history.push(state);
    }
  }
  /*
   * 恢复最初状态
   */
  reset() {
    this._history.length = 0;
  }
  /*
   * 预览
   */
  preview() {}
  /*
   * 视图缩放
   */
  resize() {}
  onChange() {}
  /*
   * 异步打开图片
   * @param {object/string} file 图片资源(Image/base64/url)
   * @return {object} Promise
   */
  async open(file) {
    let img;
    try {
      if (file instanceof Image) {
        if (/^blob:/.test(file.src)) img = file;
        else img = await loadImg(file.src);
      } else {
        img = await loadImg(typeof file === 'object' ? await readFile(file) : file);
      }
    } catch(e) {
      console.log(e)
    }
    this.sprite.src = img;
    this.draw();
  }
  draw() {
    if (this.canvas && 'getContext' in this.canvas) {
      console.log('editor draw')
      this.canvas.height = this.canvas.height;
      const context = this.canvas.getContext('2d');
      if (typeof this.before === 'function') this.before(context);
      context.drawImage(this.sprite.canvas, 0, 0);
      if (typeof this.after === 'function') this.after(context);
    }
  }
}