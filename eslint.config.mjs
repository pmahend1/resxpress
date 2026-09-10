import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
    globalIgnores([
        "out/**",
        "dist/**",
        "webpack.config.js",
        // ESM, run straight off the .ts sources by Node; outside tsconfig.json too.
        "src/test/**"
    ]),
    {
        files: ["src/**/*.ts"],
        extends: [tseslint.configs.base],
        rules: {
            /*
             * The defaults, plus PascalCase enum members - what the TypeScript
             * handbook, the compiler and the VS Code API all use. Restated in
             * full because options replace the default set rather than add to it.
             */
            "@typescript-eslint/naming-convention": ["warn",
                {
                    selector: "default",
                    format: ["camelCase"],
                    leadingUnderscore: "allow",
                    trailingUnderscore: "allow"
                },
                {
                    selector: "import",
                    format: ["camelCase", "PascalCase"]
                },
                {
                    selector: "variable",
                    format: ["camelCase", "UPPER_CASE"],
                    leadingUnderscore: "allow",
                    trailingUnderscore: "allow"
                },
                {
                    selector: "typeLike",
                    format: ["PascalCase"]
                },
                {
                    selector: "enumMember",
                    format: ["PascalCase"]
                }
            ],
            "curly": "warn",
            "eqeqeq": "warn",
            "no-throw-literal": "warn",
            "semi": "warn"
        }
    }
]);
