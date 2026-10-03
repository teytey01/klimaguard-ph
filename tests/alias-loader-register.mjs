// Registers the @/ -> src/ alias resolver hook for `node --test`.
// Used via `node --import ./tests/alias-loader-register.mjs`.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./alias-loader.mjs", pathToFileURL("./tests/").href);
