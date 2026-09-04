import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [
            "out/**",
            "dist/**",
            "webpack.config.js",
            "src/test/**"
        ]
    },
    {
        files: ["src/**/*.ts"],
        extends: [tseslint.configs.base],
        rules: {
            "@typescript-eslint/naming-convention": "warn",
            "curly": "warn",
            "eqeqeq": "warn",
            "no-throw-literal": "warn",
            "semi": "warn"
        }
    }
);
