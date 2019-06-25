// import babel from 'rollup-plugin-babel';
export default {
  input: 'src/ImgEdit.js',
  output: {
    file: 'dist/ImgEdit.js', // 输出文件
    format: 'umd',
    name: 'ImgEdit'
  }
};