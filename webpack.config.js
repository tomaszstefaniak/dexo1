const path = require("path");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const packageJson = require("./package.json");

const analyseBundle = process.env.ANALYSE === 'true';
const bundleName = `main-${packageJson.version}`;

module.exports = {
  devtool: "source-map",
  mode: "production",
  entry: {
    Jupiter: "./src/library.tsx",
    Tailwind: "./src/styles/globals.css",
    JupiterRenderer: {
      dependOn: "Jupiter",
      import: "./src/index.tsx",
    },
  },
  cache: {
    type: "filesystem",
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                "jsx": "react-jsx",
              },
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.svg$/,
        loader: "svg-inline-loader",
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: (() => {
    const plugins = [
      new NodePolyfillPlugin(),
      new MiniCssExtractPlugin({
        filename: `${bundleName}-[name].css`,
      }),
    ];

    if (analyseBundle) {
      plugins.push(new BundleAnalyzerPlugin());
    }

    return plugins;
  })(),
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      fs: false,
    },
    alias: {
      src: path.resolve(__dirname, "src"),
      public: path.resolve(__dirname, "public"),
      './../tokens/solana.tokenlist.json': false,
    },
  },
  target: "web",
  output: {
    library: "[name]",
    libraryTarget: "window",
    filename: `${bundleName}-[name].js`, // 👈 Use dynamic naming here
    chunkFilename: `${bundleName}-[name]-chunk.js`, // 👈 Fixes chunk conflict
    path: path.resolve(__dirname, "public"),
    publicPath: "/public/",
  },
  optimization: {
    minimizer: [
      '...',
      new CssMinimizerPlugin(),
    ],
    minimize: true,
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 250000,
    },
  },
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
};
