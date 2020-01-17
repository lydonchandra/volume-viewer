const path = require("path");
const {
    CleanWebpackPlugin
} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

const webpack = require('webpack');

plugins =  [
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                template: './react-example/index.html',
            }),
            // new webpack.ProvidePlugin({
            //     THREE: 'three',
            // }),
            // ignores a webcomponents dependency on a server side module since this is for front end only.
            // see: https://github.com/webcomponents/webcomponentsjs/issues/794
            new webpack.IgnorePlugin(/vertx/),
            new CopyWebpackPlugin(['react-example']),
        ]


module.exports = {
    devtool: "source-map",
    devServer: {
        publicPath: '/volumeviewer/',
        openPage: 'volumeviewer/',
        port: 9030,
    },
    entry: {
        app: "./react-example/index.jsx"
    },
    mode: "production" ,
    module: {
        rules: [{
                test: /\.(js|jsx)$/,
                include: [
                    path.resolve(__dirname, "../", "react-example")
                ],
                exclude: /node_modules/,
                use: [{
                    loader: "babel-loader"
                }],
            },
            // this rule will handle any css imports out of node_modules; it does not apply PostCSS,
            // nor does it convert the imported css to CSS Modules
            // e.g., importing antd component css
            {
                test: /\.css/,
                include: [
                    path.resolve(__dirname, "../", "node_modules")
                ],
                use: [{
                        loader: MiniCssExtractPlugin.loader
                    },
                    {
                        loader: "css-loader"
                    },
                ],
            },
            {
                test: /Worker\.js$/,
                use: 'worker-loader?inline=true'
            }
        ]
    },
    output: {
        path: path.resolve(__dirname, "../", "dist"),
        filename: "[name].[chunkhash].js"
    },
    plugins,
    resolve: {
        extensions: [".js", ".jsx", ".json"]
    },
    module: {
        rules: [{
                test: /\.(js|jsx)$/,
                include: [
                    path.resolve(__dirname, 'react-example'),
                ],
                exclude: /node_modules/,
                use: 'babel-loader',
            },
            {
                test: /Worker\.js$/,
                use: 'worker-loader?inline=true',
            },
            {
                test: /\.(obj)$/,
                use: ['raw-loader?inline=true'],
            },
            {
                test: /\.(png)$/,
                use: ['url-loader?inline=true'],
            },
        ],
    },
};
