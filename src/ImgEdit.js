/*
 * 图片编辑器
 */
const undefined = void 0
const data = {}
// input元素监听事件
function inputListener (e) {
  const fileReader = new FileReader()
  fileReader.onload = (res) => {
    this.draw(res.target.result)
  }
  fileReader.readAsDataURL(e.target.files[0])
}
/* 
 * 加载图片
 *
 * @param {string} src url/base64
 * @return {object} promise
 */
async function loadImg(src) {
  const img = new Image();
  img.crossOrigin = "anonymous";

  return new Promise((res, rej) => {
    img.onload = function () {
      res(this);
    };
    img.onerror = function (e) {
      console.error('loadImg error', e);
      rej(e);
    }
    img.src = src;
  })
}
/* 
 * 画图
 *
 * @param {string} base64
 * @param {object} context
 */
function dwaw (base64, context) {
  context.drawImage(base64, 0, 0)
}
class ImgEdit {
  constructor (option) {
    data[this] = {}
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
              case 'input': this.listen(option.input, option.listenHook)
                break
            }
          }
        }
      }
    } else
      this.canvas = document.querySelector(option)
    if (!this.canvas || typeof this.canvas !== 'object' || !(this.canvas instanceof HTMLCanvasElement)) {
      data[this] = null
      throw 'no canvas element'
    }
  }
  destroy () {
    this.unlisten()
    data[this] = this.input = this.canvas = null
  }
  // 监听输入源(<input type=file>)变化
  listen (el, hook) {
    if (typeof hook === 'function')
      data[this].inputListener = (e) => {
        const res = hook(e)
        if (res === undefined || res)
          inputListener.bind(this)(e)
      }
    else
      data[this].inputListener = inputListener.bind(this)
    this.input = typeof el === 'object' && 'addEventListener' in el ? el : document.querySelector(el)
    this.input.addEventListener('change', data[this].inputListener)
  }
  // 删除输入源监听
  unlisten () {
    this.input && this.input.removeEventListener('change', data[this].inputListener)
  }
  // 图片资源(base64)/图片地址
  async draw (file) {
    const img = await loadImg(file)
    dwaw(img, this.canvas.getContext('2d'))
  }
}

// 输入源
export const input = () => {
  console.log('Hello world')
}
// 输出
export const output = () => {
  console.log('output')
}

export default ImgEdit;