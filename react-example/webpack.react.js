const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

plugins = [
  new CleanWebpackPlugin(),
  new HtmlWebpackPlugin({
    template: "./react-example/index.html",
  }),
];

module.exports = {
  devtool: "source-map",
  devServer: {
    publicPath: "/volumeviewer/",
    openPage: "react-example/",
    port: 9030,
    host: "0.0.0.0"
  },
  entry: {
    app: path.resolve(__dirname, "index.jsx"),
  },
  mode: "development",
  module: {
    rules: [
      {
        test: /\.(obj)$/,
        use: ["raw-loader?inline=true"],
      },
      {
        test: /\.(png)$/,
        use: ["url-loader?inline=true"],
      },
      {
        test: /\.(js|jsx)$/,
        include: [ path.resolve(__dirname)
                  , path.resolve(__dirname, '/../src') ],
        exclude: [ /node_modules/, /test/],
        use: [
          {
            loader: "babel-loader",
            options: {
              configFile: path.resolve(__dirname, "react.babelrc"),
            },
          },
        ],
      },
      {
        test: /Worker\.js$/,
        use: "worker-loader?inline=true",
      }
    ],
  },
  output: {
    path: path.resolve(__dirname, "../", "dist"),
    filename: "[name].[chunkhash].js",
  },
  plugins,
  resolve: {
    extensions: [".js", ".jsx", ".json"],
  },
};
