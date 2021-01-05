module.exports = {
    "presets": [
        ["@babel/preset-env", {
            "targets": { "chrome": "70" }
            , "modules": false
        }]
    ],
    "env": {
        "es": {
            "presets": [
                ["@babel/preset-env", {
                    "targets": { "chrome": "70" }
                    , "modules": false
                }]
            ]
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
