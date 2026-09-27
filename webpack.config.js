//@ts-check

"use strict";

// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const path = require("path");

// eslint-disable-next-line no-undef
const outputPath = path.resolve(__dirname, "out");

/**@type {import('webpack').Configuration}*/
const shared = {
    devtool: "source-map",
    resolve: {
        // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [{
            test: /\.ts$/,
            exclude: /node_modules/,
            use: [{
                loader: "ts-loader"
            }]
        }]
    }
};

/**@type {import('webpack').Configuration}*/
const extensionConfig = {
    ...shared,
    target: "node", // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
    entry: {
        extension: "./src/extension.ts"
    },
    output: {
        path: outputPath,
        filename: "[name].js",
        libraryTarget: "commonjs2",
        devtoolModuleFilenameTemplate: "../[resource-path]"
    },
    externals: {
        vscode: "commonjs vscode" // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    }
};

// A webview has no `module`, so these export nothing; the web target also rejects Node and vscode imports.
/**@type {import('webpack').Configuration}*/
const webviewConfig = {
    ...shared,
    target: "web",
    entry: {
        webpanelScript: "./src/webpanelScript.ts",
        combinedPanelScript: "./src/combinedPanelScript.ts"
    },
    output: {
        path: outputPath,
        filename: "[name].js",
        devtoolModuleFilenameTemplate: "../[resource-path]"
    }
};

// eslint-disable-next-line no-undef
module.exports = [extensionConfig, webviewConfig];
