const path = require('path');
const htmlPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins :[
        new htmlPlugin(
            {
                template: "./index.html"
            }),
    ]
};