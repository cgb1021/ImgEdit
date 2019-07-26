# ImgEdit

HTML5（canvas）图片编辑工具

## 使用方法

```javascript
import ImgEdit from 'imgedit'

/*
 * @params {object|HTMLCanvasElement|string} option配置项|canvas元素|canvas选择器
 */
const edit = new ImgEdit({
        canvas: '#canvas', // 传入canvas元素或者该canvas选择器
        width: 800, // canvas宽度
        height: 600 // canvas高度
      })

/*
 * 摧毁数据
 */
edit.destroy()
/*
 * 监听输入源(<input type=file|text>)变化
 * @param {object/string} el input元素或者css选择器
 * @param {function} hook 监听方法
 */
edit.listen(el, hook)
/*
 * 移除input监听事件
 */
edit.unlisten()
/*
 * 清空img
 */
edit.close()
/*
 * 清理选择范围
 */
edit.clean()
/*
 * 重置
 */
edit.reset()
/*
 * 获取图片宽度
 * @return int
 */
edit.width()
/*
 * 获取图片高度
 * @return int
 */
edit.height()
/*
 * 设定状态变化监听方法
 * @param {function} fn
 */
edit.onChange(fn)
/*
 * 打开文件
 * @param {object/string} file blob/base64/url
 * @return Promise
 */
edit.open(file)
/*
 * 保存为base64
 * @param {string} mime
 * @param {float} quality jpg文件输出质量
 * @return string
 */
edit.toDataURL(mime, quality)
/*
 * 保存为blob
 * @param {string} mime
 * @param {float} quality jpg文件输出质量
 * @return Promise
 */
edit.toBlob(mime, quality)
/*
 * 画图
 */
edit.draw()
/*
 * 视图缩放
 * @param {float/int} scale
 */
edit.scale(scale)
/*
 * 裁剪（左上角为原点）
 * @param {int} rw 裁剪区域宽度
 * @param {int} rh 裁剪区域高度
 * @param {int} rx 裁剪区域x起点
 * @param {int} ry 裁剪区域y起点
 */
edit.cut(rw, rh, rx = 0, ry = 0)
/*
 * 按比例调整图片大小（和输出有关系）
 * @param {int} width
 * @param {int} height
 */
edit.resize(width, height)
/*
 * 旋转
 * @param {int/float} angle 正值为顺时针，负值逆时针，可选 90（0.5）,180（1）,270（1.5）
 */
edit.rotate(angle)
/*
 * 设置选择范围（左上角为原点）
 * @param {int} width
 * @param {int} height
 * @param {int} x
 * @param {int} y
 */
edit.setRange(width, height, x = 0, y = 0)
/*
 * 对齐
 * @param {string} pos center/top/right/bottom/left
 */
edit.align(pos)
```

## 独立方法


```javascript
import { fetchImg, loadImg, readFile, resize, cut, rotate } from 'imgedit'

/*
 * 拉取线上图片
 * @param {string} url
 * @return Promise
 */
fetchImg(url)
/*
 * 加载图片
 * @param {string} src url/base64
 * @return Promise
 */
loadImg(src)
/*
 * 加载图片
 * @param {blob} file 二进制文件
 * @return Promise
 */
readFile(file)
/*
 * 上传图片预览
 * @param {blob} file 二进制文件
 * @return Promise
 */
preview(file)
/*
 * 按比例调整图片大小
 * @param {object/string} img blob/url/base64
 * @param {int} width
 * @param {int} height
 * @return Promise 结果为base64
 */
resize(img, width, height)
/*
 * 裁剪
 * @param {object/string} img blob/url/base64
 * @param {int} width
 * @param {int} height
 * @param {int} x
 * @param {int} y
 * @return Promise 结果为base64
 */
cut(img, width, height, x, y)
/*
 * 旋转
 * @param {object/string} img blob/url/base64
 * @param {int} deg 正值为顺时针，负值逆时针，可选 90（0.5）,180（1）,270（1.5）
 * @return Promise 结果为base64
 */
rotate(deg)
```

## 示例

[ImgEdit-sample](https://github.com/cgb1021/ImgEdit-sample)

