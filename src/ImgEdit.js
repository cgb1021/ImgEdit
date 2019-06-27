/*
 * 图片编辑器
 */
 const undefined = void 0
 const data = {}
 const eventData = {
   active: false, // 点击事件开始标记
   offsetX: 0, // 点击事件开始x轴位置
   offsetY: 0, // 点击事件开始y轴位置
   rx: 0, // 原始坐标系统下的矩形选择框x轴位置
   ry: 0, // 原始坐标系统下的矩形选择框y轴位置
   rw: 0, // 原始坐标系统下的矩形选择框宽度
   rh: 0, // 原始坐标系统下的矩形选择框高度
   dx: 0, // 原始坐标系统下的画图x轴位置
   dy: 0 // 原始坐标系统下的画图y轴位置
 }
 const range = {
   rx: 0,
   ry: 0,
   rw: 0,
   rh: 0
 } // 坐标变换后的矩形选择框数据
 const fontSize = 12
 const lineHeight = 1.2
 let altKey = false // alt键按下标记
/* 
 * 加载图片
 *
 * @param {string} src url/base64
 * @return {object} promise
 */
export function loadImg (src) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  return new Promise((res, rej) => {
    img.onload = function () {
      res(this)
    }
    img.onerror = function (e) {
      console.error('loadImg error', e)
      rej(e)
    }
    img.src = src
  })
}
/* 
 * 图片转base64
 *
 * @param {object} file
 * @return {object} promise
 */
export function readFile(file) {
  const fileReader = new FileReader
  return new Promise((res) => {
    fileReader.onload = (e) => {
      res(e.target.result)
    }
    fileReader.readAsDataURL(file)
  })
}
// 移动事件
function moveEvent(e) {
  e.preventDefault();
  e.stopPropagation();
  switch (e.type) {
    case "mousedown":
      eventData.active = true;
      eventData.offsetX = e.offsetX - eventData.dx;
      eventData.offsetY = e.offsetY - eventData.dy;

      if (altKey) {
        eventData.rx = e.offsetX;
        eventData.ry = e.offsetY;
      }
      break;
    case "mouseup":
      eventData.active = false;
      break;
    case "mousemove":
      if (eventData.active) {
        if (altKey) {
          eventData.rw = e.offsetX - eventData.rx;
          eventData.rh = e.offsetY - eventData.ry;
        } else {
          eventData.dx = e.offsetX - eventData.offsetX;
          eventData.dy = e.offsetY - eventData.offsetY;
        }

        this.draw();
      }
      break;
    case "mousewheel":
      const direct = e.wheelDelta ?
        e.wheelDelta > 0 ?
        0 :
        1 :
        e.detail > 0 ?
        0 :
        1 // 0 上(缩小，scale变小) 1 下(放大，scale变大)
      const state = data[this]

      eventData.offsetX = e.offsetX;
      eventData.offsetY = e.offsetY;
      switch (state.angle) {
        case .5:
          offsetX = e.offsetY;
          offsetY = this.canvas.width - e.offsetX;
          break;
        case 1.5:
          offsetX = this.canvas.height - e.offsetY;
          offsetY = e.offsetX;
          break;
        case 1:
          offsetX = this.canvas.width - e.offsetX;
          offsetY = this.canvas.height - e.offsetY;
          break;
        default:
          offsetX = e.offsetX;
          offsetY = e.offsetY;
      }

      this.scale(direct ? 0.1 : -0.1);
      break;
  }
}
function stateChange(data, type) {
  typeof data.stateChange === 'function' && data.stateChange(type)
}
/*
 * 画文字
 */
function drawText (context, str, x, y, align = 'left') {
  const padding = 5;
  context.font = `${fontSize}px Arial`;
  const m = context.measureText(str);
  context.fillStyle = "rgba(255,255,255,.5)";
  context.fillRect(align !== 'right' ? x : x - m.width - padding * 2, y - fontSize * lineHeight, m.width + padding * 2 - 1, fontSize * lineHeight * 1.5 - 1);

  context.fillStyle = "#000";
  context.textAlign = align;
  context.fillText(
    str,
    align !== 'right' ? x + padding : x - padding,
    y
  );
}
/* 
 * 画矩形选择框
 */
function drawRect (context, data) {
  let {
    rx,
    ry,
    rw,
    rh,
    dx,
    dy
  } = eventData;
  if (rw < 0) {
    rx += rw;
    rw = -rw;
  }
  if (rh < 0) {
    ry += rh;
    rh = -rh;
  }

  if (rw && rh) {
    const rt = data.scale / data.ratio / viewScale;

    context.setLineDash([5, 2]);
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.strokeRect(rx, ry, rw, rh);

    drawText(context, `${Math.floor((rx - dx) * rt)}, ${Math.floor((ry - dy) * rt)}`, rx, ry + fontSize * lineHeight);
    drawText(context, `${Math.floor(rw * rt)} x ${Math.floor(rh * rt)}`, rx + rw, ry + rh - fontSize * .5, 'right');
  }
}
/* 
 * 画图
 *
 * @param {string} img
 * @param {object} canvas
 */
function dwaw (img, canvas, data) {
  const context = canvas.getContext('2d')
  context.clearRect(0, 0, canvas.width, canvas.height)
  // 画背景
  const bgSize = 10
  const xs = Math.ceil(canvas.width / bgSize) // 画canvas背景x轴循环次数
  const ys = Math.ceil(canvas.height / bgSize) // 画canvas背景y轴循环次数
  const color1 = "#ccc"
  const color2 = "#eee" // 画布和图片的比例
  
  for (let y = 0; y < ys; ++y) {
    let color = y % 2 ? color1 : color2;
    for (let x = 0; x < xs; ++x) {
      context.fillStyle = color;
      context.fillRect(x * bgSize, y * bgSize, bgSize, bgSize);
      color = color === color1 ? color2 : color1;
    }
  }
  if (!data.angle || data.angle === 1) {
    data.ratio = Math.min(
      canvas.width / data.width,
      canvas.height / data.height
    );
  } else {
    data.ratio = Math.min(
      canvas.width / data.height,
      canvas.height / data.width
    );
  }
  // 画矩形选择框
  if (eventData.rw && eventData.rh) {
    drawRect(context, data)
    stateChange(data, 'range');
  }
  context.drawImage(img, 0, 0)
}
class ImgEdit {
  constructor (option) {
    data[this] = {
      x: 0, // 图片x轴位置
      y: 0, // 图片y轴位置
      width: 0, // 图片裁剪宽度
      height: 0, // 图片裁剪高度
      scale: 1, // 缩放比例(和输出有关系)
      angle: 0, // 角度
      ratio: 1,
      dataURL: ''
    }
    // 获取canvas元素
    if (typeof option === 'object') {
      if (option instanceof HTMLCanvasElement)
        this.canvas = option
      else {
        this.canvas = typeof option.canvas === 'string' ? document.querySelector(option.canvas) : option.canvas
        if (this.canvas) {
          for (const k in option) {
            switch (k) {
              case 'width':
                this.canvas.width = option.width
                break
              case 'height':
                this.canvas.height = option.height
                break
              case 'input': this.listen(option.input, option.inputListener)
                break
            }
          }
        }
      }
    } else
      this.canvas = document.querySelector(option)
    const event = moveEvent.bind(this)
    this.canvas.addEventListener("mousewheel", event, false)
    this.canvas.addEventListener("mousedown", event, false)
    this.canvas.addEventListener("mouseup", event, false)
    this.canvas.addEventListener("mousemove", event, false)
    data[this].moveEvent = event
  }
  destroy () {
    this.unlisten()
    this.canvas.removeEventListener("mousewheel", data[this].moveEvent, false)
    this.canvas.removeEventListener("mousedown", data[this].moveEvent, false)
    this.canvas.removeEventListener("mouseup", data[this].moveEvent, false)
    this.canvas.removeEventListener("mousemove", data[this].moveEvent, false)
    data[this] = this.input = this.canvas = null
  }
  // 监听输入源(<input type=file>)变化
  listen (el, hook) {
    if (typeof hook === 'function')
      data[this].inputListener = (e) => {
        const res = hook(e)
        if (res === undefined || res) {
          this.draw(e.target.files[0])
        }
      }
    else {
      data[this].inputListener = (e) => {
        this.draw(e.target.files[0])
      }
    }
    this.input = typeof el === 'object' && 'addEventListener' in el ? el : document.querySelector(el)
    this.input.addEventListener('change', data[this].inputListener)
    return this
  }
  // 删除输入源监听
  unlisten () {
    this.input && this.input.removeEventListener('change', data[this].inputListener)
    return this
  }
  // 图片资源(base64)/图片地址
  async draw (file) {
    let img
    if (file) {
      if (file instanceof HTMLImageElement) {
        img = file
      } else {
        img = await loadImg(typeof file === 'object' ? await readFile(file) : file)
      }
      data[this].width = img.width
      data[this].height = img.height
    } else if (data[this].dataURL) {
      img = await loadImg(data[this].dataURL)
    }
    dwaw(img, this.canvas, data[this])
    return this
  }
  dataURL (base64) {
    data[this].dataURL = base64
    return this
  }
  toDataURL (mime) {
    return this.canvas.toDataURL(mime ? mime : 'image/jpeg')
  }
  toBlob () {
    console.log('toBlob')
  }
  resize () {
    console.log('resize')
  }
  scale () {
    console.log('scale')
  }
}

export default ImgEdit;