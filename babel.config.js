module.exports = {
    "presets": [
        ["@babel/preset-env", { "targets": { "chrome": "60" } }]
    ],
    "env": {
        "es": {
            "presets": [
                ["@babel/preset-env", {
                    "modules": false,
                }],
            ],
        },
    },
    "plugins": [
        ["babel-plugin-inline-import", {
            "extensions": [".obj"],
        }],
        ["inline-import-data-uri", {
            "extensions": [".png"],
        }],
    ],
};
