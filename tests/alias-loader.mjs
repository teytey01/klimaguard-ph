// ESM resolver hook so `node --test` can import modules that use the project's
// `@/*` → `src/*` path alias (the same alias tsconfig + Next resolve). Without
// this, Node can't resolve `@/lib/...` imports and tests that pull in aliased
// modules fail with ERR_MODULE_NOT_FOUND. Registered via `node --import`.
//
// It also appends TypeScript extensions (and an index file) when the alias
// target is extensionless, since source files import `@/lib/x` without `.ts`
// but Node's native type-stripping needs the concrete file URL.
import { pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";
import { existsSync } from "node:fs";

const SRC_ROOT = resolvePath(process.cwd(), "src");

const CANDIDATE_SUFFIXES = ["", ".ts", ".tsx", ".mjs", ".js", "/index.ts", "/index.tsx"];

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "@" || specifier.startsWith("@/")) {
    const rest = specifier === "@" ? "index" : specifier.slice(2);
    const basePath = resolvePath(SRC_ROOT, rest);
    for (const suffix of CANDIDATE_SUFFIXES) {
      const candidate = basePath + suffix;
      if (existsSync(candidate)) {
        return nextResolve(pathToFileURL(candidate).href, context);
      }
    }
    // Fall through to the default resolver (which will raise a clear error).
    return nextResolve(pathToFileURL(basePath).href, context);
  }
  return nextResolve(specifier, context);
}
