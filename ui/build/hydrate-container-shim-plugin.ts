import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Compiler, Compilation } from "@rspack/core";

const buildDir = path.dirname(fileURLToPath(import.meta.url));
const bannerPath = path.join(buildDir, "hydrate-container-banner.js");
const shimPath = path.join(buildDir, "hydrate-container-shim.js");

export class HydrateContainerShimPlugin {
  apply(compiler: Compiler) {
    compiler.hooks.thisCompilation.tap("HydrateContainerShimPlugin", (compilation: Compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: "HydrateContainerShimPlugin",
          stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        (assets) => {
          const bannerSource = fs.readFileSync(bannerPath, "utf8");
          const shimSource = fs.readFileSync(shimPath, "utf8");

          for (const assetName of Object.keys(assets)) {
            if (!assetName.endsWith("remoteEntry.js")) {
              continue;
            }
            const asset = compilation.getAsset(assetName);
            if (!asset) {
              continue;
            }
            const source = asset.source.source();
            const body = typeof source === "string" ? source : Buffer.from(source).toString("utf8");
            const combined = `${bannerSource}\n${body}\n${shimSource}`;
            compilation.updateAsset(assetName, new compiler.webpack.sources.RawSource(combined));
          }
        },
      );
    });
  }
}
