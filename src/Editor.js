import Sprite from './Sprite'
const state = {
  viewRatio: 0,
  range: {
    x: 0, // 选择范围（setRange）在图片上的x轴位置（原始坐标系统）
    y: 0, // 选择范围（setRange）在图片上的y轴位置（原始坐标系统）
    width: 0, // 选择范围（cut）宽度（原始坐标系统）
    height: 0 // 选择范围（cut）高度（原始坐标系统）
  } // 矩形选择框数据（左上角为原点）
};
const eventNames = ['mousewheel', 'mousedown', 'mouseup', 'mouseout', 'mousemove'];
/*
 * 图片编辑器
 * 输入，输出，编辑，辅助
 */
export default class Editor {
  constructor(option) {
    this._state = Object.assign({}, state); // 当前状态

    const _history = []; // 操作步骤（state）集合
    let _historyIndex = 0; // 操作步骤index

    Object.defineProperties(this, {
      _historyIndex: {
        set(val) {
          if (typeof val !== 'number') return;
          _historyIndex = Math.max(0, Math.min(_history.length - 1, val));
          if (_history.length) {
            this._state = Object.assign({}, _history[_historyIndex]);
          }
        },
        get() {
          return _historyIndex;
        }
      }
    })

    // 获取canvas元素
    if (option && typeof option === 'object') {
      if ('getContext' in option) {
        this.canvas = option;
      } else {
        for (const k in option) {
          switch (k) {
            case 'canvas':
              this.canvas = typeof option.canvas === 'string' ? document.querySelector(option.canvas) : option.canvas;
              break;
            case 'width':
              this.canvas.width = option.width;
              break;
            case 'height':
              this.canvas.height = option.height;
              break;
            case 'before':
              this.before(option.before);
              break;
            case 'after':
              this.after(option.after);
              break;
            default:
              ;
          }
        }
      }
    } else if (option)
      this.canvas = document.querySelector(option);
    if (this.canvas) {
      const event = moveEvent.bind(this);
      eventNames.forEach((name) => {
        this.canvas.addEventListener(name, event, false);
      })
      state.moveEvent = event;
    }
  }
  /*
   * 上一步操作
   */
  prev() {
    this._historyIndex = this._historyIndex - 1;
  }
  /*
   * 下一步操作
   */
  next() {
    this._historyIndex = this._historyIndex + 1;
  }
  /*
   * 保存状态（清理history）
   */
  save() {
    const state = this._history[this._historyIndex];
    this._historyIndex = 0;
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
}