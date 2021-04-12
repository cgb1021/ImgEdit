// 辅助方法
import Sprite from './Sprite'
/*
 * @description 获取HTMLElement
 * @param {string|HTMLElement} el
 * @return HTMLElement
 */

/* 
 * 加载线上图片
 *
 * @param {string} url
 * @return {object} promise
 */
export const fetchImg = (url) => {
  return new Promise((resolve, reject) => {
    if (!url || typeof url !== 'string' || !/^(?:https?:)?\/\//i.test(url)) reject(0);
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = () => {
      const file = xhr.response;
      let name = '';
      const m = url.match(/[\w.-]+\.(?:jpe?g|png|gif|bmp)$/);
      if (m) name = m[0];
      else {
        name = Date.now();
        const ext = file.type.split('/')[1];
        switch (ext) {
          case 'jpeg':
            name = `${name}.jpg`;
            break;
          default:
            name = `${name}.${ext}`;
            break;
        }
      }
      file.name = name;
      resolve(file);
    }
    xhr.onerror = (e) => {
      console.error('fetchImg err', e);
      reject(e);
    }
    xhr.open('GET', url);
    // xhr.overrideMimeType('text/plain; charset=x-user-defined')
    xhr.send(null);
  })
}
/* 
 * 加载图片
 *
 * @param {string} src url/base64
 * @return {object} promise
 */
export const loadImg = (src) => {
  return new Promise((resolve, reject) => {
    if (!src || typeof src !== 'string' || !/^(?:data:image\/[^;]+;\s*base64\s*,|(?:https?:)?\/\/)/i.test(src)) {
      reject(0);
      return;
    }
    let img = new Image;
    img.crossOrigin = "anonymous";
    img.onload = function () {
      resolve(this);
      img = img.onload = img.onerror = null;
    }
    img.onerror = function (e) {
      console.error('loadImg error', e);
      img = img.onload = img.onerror = null;
      reject(e);
    }
    img.src = src;
  })
}
/* 
 * 图片转base64
 *
 * @param {blob} file
 * @return {object} promise
 */
export const readFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || typeof file !== 'object') reject(0);
    let fileReader = new FileReader;
    fileReader.onload = (e) => {
      resolve(e.target.result);
      fileReader = fileReader.onload = fileReader.onerror = null;
    }
    fileReader.onerror = (e) => {
      console.error('readFile error', e);
      fileReader = fileReader.onload = fileReader.onerror = null;
      reject(e);
    }
    fileReader.readAsDataURL(file);
  })
}
/* 
 * 上传图片预览
 *
 * @param {blob} file
 * @return {object} promise
 */
export const preview = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || typeof file !== 'object') reject(0);
    let img = new Image;
    img.onload = function () {
      URL.revokeObjectURL(this.src);
    }
    img.onerror = (e) => {
      reject(e);
    }
    img.src = URL.createObjectURL(file);
    resolve(img);
  })
}
export const resize = async (img, width, height) => {
  if (!width && !height) return false;
  if (typeof img === 'string' && /^(?:https?:)?\/\//.test(img)) {
    img = await fetchImg(img);
  }
  const mime = img.type;
  const edit = new Sprite(img);
  const b64 = edit.resize(width, height).toDataURL(mime);
  return b64;
}
export const cut = async (img, width, height, x, y) => {
  if (!width && !height) return false;
  if (typeof img === 'string' && /^(?:https?:)?\/\//.test(img)) {
    img = await fetchImg(img);
  }
  const mime = img.type;
  const edit = new Sprite(img);
  const b64 = edit.cut(width, height, x, y).toDataURL(mime);
  return b64;
}
export const rotate = async (img, deg) => {
  if (!deg) return false;
  if (typeof img === 'string' && /^(?:https?:)?\/\//.test(img)) {
    img = await fetchImg(img);
  }
  const mime = img.type;
  const edit = new Sprite(img);
  const b64 = edit.rotate(deg).toDataURL(mime);
  return b64;
}
