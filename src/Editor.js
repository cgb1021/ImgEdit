import Sprite from './Sprite'
import { querySelector, loadImg, readFile } from './Utils'
// 移动事件
const eventData = {
  active: false, // 点击事件开始标记
  offsetX: 0, // 点击事件开始x轴位置
  offsetY: 0 // 点击事件开始y轴位置
};
function moveEvent(e) {
  e.preventDefault();
  e.stopPropagation();
  const state = this.state;
  const sprite = this.sprite;
  switch (e.type) {
    case 'mousedown':
      ctrlKey = e.ctrlKey;
      if (!ctrlKey) {
      } else {
        // 按下ctrl键
        eventData.active = true;
        eventData.offsetX = e.offsetX;
        eventData.offsetY = e.offsetY;
      }
      break;
    case 'mouseout':
    case 'mouseup':
      if (eventData.active) {
        this.canvas.style.cursor = 'default';
        eventData.active = false;
      }
      break;
    case 'mousemove':
      if (eventData.active) {
        if (ctrlKey) {
        } else {
        }
      }
      break;
    case 'mousewheel':
      const direct = e.wheelDelta ?
        (e.wheelDelta > 0 ?
        0 :
        1) :
        (e.detail > 0 ?
        0 :
        1); // 0 上(缩小，scale变小) 1 下(放大，scale变大)
      eventData.offsetX = e.offsetX;
      eventData.offsetY = e.offsetY;
      this.scale(state.ratio + (direct ? 0.1 : -0.1), 1);
      break;
  }
}
/*
 * 图片编辑器
 * 输入，输出，编辑，辅助
 */
export default class Editor {
  constructor(el) {
    const sprite = new Sprite();
    const history = []; // 操作步骤（state）集合
    const event = moveEvent.bind(this);
    const eventNames = ['mousewheel', 'mousedown', 'mouseup', 'mouseout', 'mousemove'];
    const _state = {
      ratio: 0,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      range: {
        x: 0, // 选择范围（setRange）在图片上的x轴位置（原始坐标系统）
        y: 0, // 选择范围（setRange）在图片上的y轴位置（原始坐标系统）
        width: 0, // 选择范围（cut）宽度（原始坐标系统）
        height: 0 // 选择范围（cut）高度（原始坐标系统）
      } // 矩形选择框数据（左上角为原点）
    };
    let historyIndex = 0; // 操作步骤index
    let canvas = null;

    Object.defineProperties(this, {
      historyIndex: {
        set(val) {
          if (typeof val !== 'number') return;
          historyIndex = Math.max(0, Math.min(history.length - 1, val));
          this.draw();
        },
        get() {
          return historyIndex;
        }
      },
      state: {
        get() {
          return history.length ? history[historyIndex] : Object.assign({}, _state, canvas ? { width: canvas.width, height: canvas.height } : {});
        }
      },
      canvas: {
        set(el) {
          this.destroy();
          canvas = querySelector(el);
          if (canvas && 'getContext' in canvas) {
            eventNames.forEach((name) => {
              canvas.addEventListener(name, event, false);
            })
          } else {
            canvas = null;
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

    this.destroy =  () => {
      if (canvas) {
        eventNames.forEach((name) => {
          canvas.removeEventListener(name, event);
        })
      }
      canvas = null;
    }
    /*
     * 推入一个状态
     */
    this.push = (state) => {
      if (!state || typeof state !== 'object') return;
      history.push(Object.assign({}, _state, state))
      historyIndex = history.length - 1;
      this.draw();
    }
    this.merge = (state) => {
      if (!history.length) return;
      Object.assign(history[historyIndex], state);
      this.draw();
    }
    /*
     * 保存当前状态
     */
    this.save = () => {
      if (history.length < 2) return;
      const state = history[historyIndex];
      historyIndex = 0;
      history.length = 0;
      history.push(state);
      this.draw();
    }
    /*
     * 清理history
    */
    this.clean = () => {
      historyIndex = 0;
      history.length = 0;
      this.draw();
    }
    this.canvas = el;
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
    const canvas = this.canvas;
    if (!canvas || !file) return;
    try {
      if (file instanceof Image) {
        if (/^blob:/.test(file.src)) img = file;
        else img = await loadImg(file.src);
      } else {
        img = await loadImg(typeof file === 'object' ? await readFile(file) : file);
      }
    } catch(e) {
      console.log(e);
      return;
    }
    if (!img) return;
    this.sprite.src = img;
    this.clean();
    const ratio = Math.min(1, Math.min(canvas.width / img.width, canvas.height / img.height));
    const width = img.width * ratio;
    const height = img.height * ratio;
    const x = (canvas.width - width) / 2;
    const y = (canvas.height - height) / 2;
    this.push({ ratio, x, y, width, height });
  }
  draw() {
    if (this.canvas) {
      console.log('editor draw')
      this.canvas.height = this.canvas.height;
      const context = this.canvas.getContext('2d');
      const { x, y, width, height, ratio } = this.state;
      const { width: sw, height: sh } = this.sprite.canvas;
      if (typeof this.before === 'function') this.before(context);
      context.drawImage(this.sprite.canvas, 0, 0, sw | 0, sh | 0, x | 0, y | 0, (width * ratio) | 0, (height * ratio) | 0);
      if (typeof this.after === 'function') this.after(context);
    }
  }
  close() {
    this.clean();
    this.destroy();
  }
  scale(ratio, wheel) {
    if (ratio < .1 || ratio > 10) {
      return;
    }
    // 放大比例不能小于1或大于10
    const state = this.state;
    const _ratio = state.ratio;
    const diff = ratio - _ratio;
    const { x, y } = state;
    const { width, height } = this.getSize();
    if (wheel
        && eventData.offsetX > x
        && eventData.offsetY > y
        && eventData.offsetX < x + width
        && eventData.offsetY < y + height) {
      // 在图片范围内，以鼠标位置为中心
      state.x -= ((eventData.offsetX - x) / _ratio) * diff;
      state.y -= ((eventData.offsetY - y) / _ratio) * diff;
    } else {
      // 以图片在画布范围内中心点
      state.x -= (state.width * ratio - width) * 0.5;
      state.y -= (state.height * ratio - height) * 0.5;
    }
    state.ratio = ratio;
    this.merge(state);
  }
  getSize () {
    const { ratio, width, height } = this.state;
    return {
      width: width * ratio,
      height: height * ratio,
      ratio
    };
  }
}