import Sprite from './Sprite'
import { querySelector, loadImg, readFile } from './Utils'
// 移动事件
const eventData = {
  active: false, // 点击事件开始标记
  offsetX: 0, // 点击事件开始x轴位置
  offsetY: 0, // 点击事件开始y轴位置
  ctrlKey: false // ctrl键按下标记
};
function moveEvent(e) {
  e.preventDefault();
  e.stopPropagation();
  const { x, y, ratio } = this.state;
  const { width, height } = this.src;
  switch (e.type) {
    case 'mousedown':
      eventData.active = true;
      eventData.ctrlKey = e.ctrlKey;
      eventData.offsetX = e.offsetX;
      eventData.offsetY = e.offsetY;
      if (!eventData.ctrlKey && e.offsetX > x && e.offsetY > y && e.offsetX < x + width * ratio && e.offsetY < y + height * ratio) {
        // 在图片范围内
        eventData.offsetX = e.offsetX - x;
        eventData.offsetY = e.offsetY - y;
      }
      break;
    case 'mouseout':
    case 'mouseup':
      if (eventData.active) {
        eventData.active = false;
      }
      break;
    case 'mousemove':
      if (eventData.active) {
        if (eventData.ctrlKey) {
        } else {
          this.merge({
            x: e.offsetX - eventData.offsetX,
            y: e.offsetY - eventData.offsetY
          })
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
      this.scale(ratio + (direct ? 0.1 : -0.1), 1);
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
    const state = {
      ratio: 1,
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
    const lastRect = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    }
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
          return history.length ? history[historyIndex] : Object.assign({}, state);
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
        get() {
          return sprite.src;
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
    this.push = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      if (history.length) {
        history.splice(historyIndex + 1);
      }
      history.push(Object.assign({}, state, obj));
      historyIndex = history.length - 1;
      this.draw();
    }
    this.merge = (obj) => {
      if (!history.length) return;
      Object.assign(history[historyIndex], obj);
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
    }
    /*
     * 清理history
    */
    this.clean = () => {
      historyIndex = 0;
      history.length = 0;
    }
    this.draw = () => {
      if (canvas) {
        const context = this.canvas.getContext('2d');
        const src = sprite.src;
        const { x, y, width, height, ratio } = this.state;
        const { width: sw, height: sh } = src;
        context.clearRect(lastRect.x, lastRect.y, lastRect.width, lastRect.height);
        if (typeof this.before === 'function') this.before(context);
        context.drawImage(src, 0, 0, sw | 0, sh | 0, x | 0, y | 0, (width * ratio) | 0, (height * ratio) | 0);
        if (typeof this.after === 'function') this.after(context);
        Object.assign(lastRect, {
          x: Math.max(0, x - 1) | 0,
          y: Math.max(0, y - 1) | 0,
          width: Math.min(canvas.width, width * ratio + 1) | 0,
          height: Math.min(canvas.height, height * ratio + 1) | 0
        })
      }
    }
    /*
    * 异步打开图片
    * @param {object/string} file 图片资源(Image/base64/url)
    * @return {object} Promise
    */
    this.open = async (file) => {
      let img;
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
      sprite.src = img;
      const ratio = Math.min(1, Math.min(canvas.width / img.width, canvas.height / img.height));
      const width = img.width * ratio;
      const height = img.height * ratio;
      const x = (canvas.width - width) / 2;
      const y = (canvas.height - height) / 2;
      this.clean();
      this.push({ ratio, x, y, width, height });
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
  scale(r, wheel) {
    if (r < .1 || r > 10) {
      return;
    }
    // 放大比例不能小于1或大于10
    const state = this.state;
    const { x, y, ratio, width, height } = state;
    const diff = r - ratio;
    if (wheel
        && eventData.offsetX > x
        && eventData.offsetY > y
        && eventData.offsetX < x + width * ratio
        && eventData.offsetY < y + height * ratio) {
      // 在图片范围内，以鼠标位置为中心
      state.x -= ((eventData.offsetX - x) / ratio) * diff;
      state.y -= ((eventData.offsetY - y) / ratio) * diff;
    } else {
      // 以图片在画布范围内中心点
      state.x -= width * diff * 0.5;
      state.y -= height * diff * 0.5;
    }
    state.ratio = r;
    this.merge(state);
  }
}