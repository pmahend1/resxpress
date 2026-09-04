import { registerHooks } from "node:module";

/*
 * The extension compiles as CommonJS, so its imports are extensionless and
 * Node's ESM resolver cannot find them when it runs the TypeScript sources
 * directly. Appending ".ts" to relative specifiers is all that is needed to
 * unit test any module that does not import "vscode" - no build step and no
 * test framework dependency.
 */
registerHooks({
    resolve(specifier, context, nextResolve) {
        try {
            return nextResolve(specifier, context);
        }
        catch (error) {
            if (specifier.startsWith(".") === false) {
                throw error;
            }

            return nextResolve(`${specifier}.ts`, context);
        }
    }
});
