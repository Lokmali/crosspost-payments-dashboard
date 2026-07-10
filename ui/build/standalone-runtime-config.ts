import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ClientRuntimeConfig } from "everything-dev/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type BosResolvedConfig = {
  account: string;
  domain: string;
  title: string;
  description?: string;
  repository?: string;
  app: {
    auth?: {
      name?: string;
      production?: string;
      integrity?: string;
      sidebar?: Array<{
        icon: string;
        label: string;
        to: string;
        roleRequired?: string;
      }>;
      variables?: Record<string, unknown>;
    };
  };
};

function readBosConfig(): BosResolvedConfig {
  const resolvedPath = path.resolve(__dirname, "../../.bos/bos.resolved-config.json");
  const bosConfigPath = path.resolve(__dirname, "../../bos.config.json");
  const configPath = fs.existsSync(resolvedPath) ? resolvedPath : bosConfigPath;
  const raw = JSON.parse(fs.readFileSync(configPath, "utf8")) as BosResolvedConfig & {
    _resolved?: unknown;
  };
  const { _resolved: _ignored, ...config } = raw;
  return config;
}

export function buildStandaloneRuntimeConfig(options?: {
  port?: number;
  proxyHostPort?: number;
}): ClientRuntimeConfig {
  const config = readBosConfig();
  const port = options?.port ?? 3003;
  const origin = `http://localhost:${port}`;
  const auth = config.app.auth;
  const authUrl = auth?.production ?? "";
  const networkId = config.account.endsWith(".testnet") ? "testnet" : "mainnet";

  return {
    env: "development",
    account: config.account,
    networkId,
    hostUrl: origin,
    assetsUrl: origin,
    apiBase: "/api",
    rpcBase: "/api/rpc",
    authAvailable: Boolean(authUrl),
    repository: config.repository,
    runtime: {
      accountId: config.account,
      gatewayId: config.domain,
      runtimeBasePath: "/",
      title: config.title,
      description: config.description ?? null,
      hostUrl: origin,
    },
    ui: {
      name: "ui",
      url: origin,
      entry: `${origin}/mf-manifest.json`,
    },
    api: {
      name: "api",
      url: "http://localhost:3001",
      entry: "http://localhost:3001/mf-manifest.json",
    },
    auth: authUrl
      ? {
          name: auth?.name ?? "everything-dev_auth-plugin",
          url: authUrl,
          entry: `${authUrl.replace(/\/$/, "")}/mf-manifest.json`,
          integrity: auth?.integrity,
          sidebar: auth?.sidebar?.map((item) => ({
            ...item,
            roleRequired: item.roleRequired ?? "member",
          })),
          variables: auth?.variables,
        }
      : undefined,
    plugins: {},
  };
}
