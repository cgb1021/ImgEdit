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
  const { x, y, ratio } = this.view;
  const { width, height } = this.src;
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
        const x = Math.min(e.offsetX, eventData.offsetX);
        const y = Math.min(e.offsetY, eventData.offsetY);
        const width = Math.max(e.offsetX, eventData.offsetX) - x;
        const height = Math.max(e.offsetY, eventData.offsetY) - y;
        this.range = { width, height, x, y }
      } else if (eventData.active) {
        this.view = {
          x: e.offsetX - eventData.offsetX,
          y: e.offsetY - eventData.offsetY
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
 * 画矩形选择框
 */
function drawRect (ctx, state) {
  const { range: {
      x,
      y,
      width,
      height
    }} = state;
  if (width && height) {
    ctx.setLineDash([5, 2]);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
  }
}
/*
 * 图片编辑器
 * 输入，输出，编辑，辅助
 */
export default class Editor {
  constructor(el) {
    const sprite = new Sprite();
    const event = moveEvent.bind(this);
    const eventNames = ['mousewheel', 'mousedown', 'mouseup', 'mouseout', 'mousemove'];
    const history = []; // 操作步骤（state）集合
    const state = {
      width: 0,
      height: 0,
      angle: 0,
      sx: 0,
      sy: 0,
      sw: 0,
      sh: 0,
      rx: 1,
      ry: 1
    };
    const view = {
      ratio: 1,
      x: 0,
      y: 0
    };
    const range = {
      x: 0, // 选择范围（setRange）在图片上的x轴位置（原始坐标系统）
      y: 0, // 选择范围（setRange）在图片上的y轴位置（原始坐标系统）
      width: 0, // 选择范围（cut）宽度（原始坐标系统）
      height: 0 // 选择范围（cut）高度（原始坐标系统）
    } // 矩形选择框数据（左上角为原点）
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
          if (typeof val !== 'number' || val === historyIndex) return;
          historyIndex = Math.max(0, Math.min(history.length - 1, val));
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
      view: {
        set(obj) {
          if (obj && typeof obj === 'object') {
            Object.assign(view, obj);
            stateChange();
            this.draw();
          }
        },
        get() {
          return view;
        }
      },
      range: {
        set(obj) {
          if (obj && typeof obj === 'object') {
            Object.assign(range, obj);
            stateChange();
            this.draw();
          }
        },
        get() {
          return range;
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

    /*
     * 更新sprite/触发onchange
     */
    const stateChange = (obj) => {
      const state = this.state;
      if (obj && typeof obj === 'object') {
        if (typeof obj.angle !== 'undefined' && obj.angle !== state.angle) {
          sprite.rotate(obj.angle);
          state.width = sprite.width;
          state.height = sprite.height;
          obj.angle = sprite.angle;
        }
        if (obj.width && obj.height && (obj.width !== state.width || obj.height !== state.height)) {
          sprite.resize(obj.width, obj.height);
        }
      }
      if (typeof this.onChange === 'function') {
        this.onChange(Object.assign({}, state, view, obj));
      }
      return Object.assign({}, state, obj);
    }
    /*
     * 推入一个状态
     */
    this.push = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      if (history.length && historyIndex !== history.length - 1) {
        history.splice(historyIndex + 1);
      }
      history.push(stateChange(obj));
      historyIndex = history.length - 1;
      this.draw();
    }
    /*
     * 保存当前状态
     */
    this.save = () => {
      if (history.length < 2) return;
      const state = this.state;
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
      if (!canvas) return;

      const context = canvas.getContext('2d');
      const src = sprite.src;
      const { width: sw, height: sh } = src;
      const { x, y, ratio } = this.view;
      const { width, height } = this.state;

      context.clearRect(lastRect.x, lastRect.y, lastRect.width, lastRect.height);
      if (typeof this.before === 'function') this.before(context);
      context.drawImage(src, 0, 0, sw | 0, sh | 0, x | 0, y | 0, (width * ratio) | 0, (height * ratio) | 0);
      drawRect(context, {ratio, range});
      if (typeof this.after === 'function') this.after(context);

      Object.assign(lastRect, {
        x: Math.max(0, x - 1) | 0,
        y: Math.max(0, y - 1) | 0,
        width: Math.min(canvas.width, width * ratio + 2) | 0,
        height: Math.min(canvas.height, height * ratio + 2) | 0
      })
      // console.log('editor draw', lastRect, canvas.width, canvas.height)
    }
    /*
    * 异步打开图片
    * @param {object/string} file 图片资源(Image/base64/url)
    * @return {object} Promise
    */
    this.open = async (file) => {
      if (!canvas || !file) return;
      let img;
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
      const { width, height } = img;
      const ratio = Math.min(1, Math.min(canvas.width / width, canvas.height / height));
      const x = (canvas.width - width * ratio) / 2;
      const y = (canvas.height - height * ratio) / 2;
      this.view = { ratio, x, y };
      this.clean();
      this.push({ width, height, sw: width, sh: height });
    }
    this.resize = (width, height) => {
      const { width: sw, height: sh } = this.state;
      let { ratio } = view;
      width = +width;
      height = +height;
      if (width && height) {
        ratio *= Math.min( sw / width, sh / height);
      } else if (width) {
        ratio *= sw / width;
        height = width / (sw / sh);
      } else if (height) {
        ratio *= sh / height;
        width = (sw / sh) * height;
      }

      this.view = { ratio };
      this.push({ width, height });
    }
    this.rotate = (angle) => {
      this.push({
        angle
      })
    }
    this.cut = () => {
      console.log(range)
    }
    this.toDataURL = (mime = 'image/jpeg', quality = .8) => {
      return sprite.toDataURL(mime, quality);
    }
    this.toBlob = (mime = 'image/jpeg', quality = .8) => {
      return sprite.toBlob(mime, quality);
    }
    this.destroy =  () => {
      if (canvas) {
        eventNames.forEach((name) => {
          canvas.removeEventListener(name, event);
        })
      }
      canvas = null;
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
  scale(r, wheel) {
    if (r < .1 || r > 10) {
      return;
    }
    // 放大比例不能小于1或大于10
    const view = this.view;
    const { x, y, ratio } = view;
    const { width, height } = this.state;
    const diff = r - ratio;
    if (wheel
        && eventData.offsetX > x
        && eventData.offsetY > y
        && eventData.offsetX < x + width * ratio
        && eventData.offsetY < y + height * ratio) {
      // 在图片范围内，以鼠标位置为中心
      view.x -= ((eventData.offsetX - x) / ratio) * diff;
      view.y -= ((eventData.offsetY - y) / ratio) * diff;
    } else {
      // 以图片在画布范围内中心点
      view.x -= width * diff * 0.5;
      view.y -= height * diff * 0.5;
    }
    view.ratio = r;
    this.view = view;
  }
}