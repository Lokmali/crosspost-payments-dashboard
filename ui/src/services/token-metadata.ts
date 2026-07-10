type TokenMetadata = {
  symbol: string;
  name: string;
  decimals: number;
};

const metadataCache = new Map<string, TokenMetadata>();

function encodeBase64(value: string) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value).toString("base64");
  }
  return btoa(value);
}

function decodeResultBytes(bytes: number[]) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("utf8");
  }
  return new TextDecoder().decode(Uint8Array.from(bytes));
}

function getRpcUrl(networkId: string) {
  return networkId === "testnet" ? "https://rpc.testnet.near.org" : "https://rpc.mainnet.near.org";
}

function isNearNativeToken(token: string | null | undefined) {
  if (!token) return true;
  const normalized = token.trim();
  return !normalized || normalized.toUpperCase() === "NEAR";
}

function isTokenContractId(token: string) {
  return /\.(near|testnet|tg)$/i.test(token) || /^[0-9a-f]{32,}$/i.test(token);
}

async function fetchFtMetadata(contractId: string, networkId: string): Promise<TokenMetadata> {
  const response = await fetch(getRpcUrl(networkId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "ft-metadata",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "final",
        account_id: contractId,
        method_name: "ft_metadata",
        args_base64: encodeBase64("{}"),
      },
    }),
  });

  const payload: {
    result?: { result?: number[] };
    error?: { message?: string };
  } = await response.json();

  if (!payload.result?.result) {
    throw new Error(payload.error?.message ?? "Failed to load token metadata");
  }

  const metadata = JSON.parse(decodeResultBytes(payload.result.result)) as {
    symbol?: string;
    name?: string;
    decimals?: number;
  };

  if (!metadata.symbol) {
    throw new Error("Token metadata missing symbol");
  }

  return {
    symbol: metadata.symbol,
    name: metadata.name ?? metadata.symbol,
    decimals: typeof metadata.decimals === "number" ? metadata.decimals : 0,
  };
}

export async function getTokenMetadata(
  contractId: string,
  networkId = "mainnet",
): Promise<TokenMetadata> {
  const cacheKey = `${networkId}:${contractId}`;
  const cached = metadataCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const metadata = await fetchFtMetadata(contractId, networkId);
  metadataCache.set(cacheKey, metadata);
  return metadata;
}

export async function resolveTokenSymbol(
  token: string | null | undefined,
  networkId = "mainnet",
): Promise<string> {
  if (isNearNativeToken(token)) {
    return "NEAR";
  }

  const contractId = token!.trim();
  if (!isTokenContractId(contractId)) {
    return contractId;
  }

  try {
    const metadata = await getTokenMetadata(contractId, networkId);
    return metadata.symbol;
  } catch {
    return "FT";
  }
}

export async function enrichPaymentsWithTokenSymbols<
  T extends { token: string; raw: { token?: string | null } },
>(payments: T[], networkId = "mainnet"): Promise<T[]> {
  const contractIds = [
    ...new Set(
      payments
        .map((payment) => payment.raw.token)
        .filter((token): token is string => Boolean(token && !isNearNativeToken(token))),
    ),
  ];

  const symbols = new Map<string, string>();
  await Promise.all(
    contractIds.map(async (contractId) => {
      symbols.set(contractId, await resolveTokenSymbol(contractId, networkId));
    }),
  );

  return payments.map((payment) => {
    const contractId = payment.raw.token;
    if (!contractId || isNearNativeToken(contractId)) {
      return payment;
    }

    const symbol = symbols.get(contractId);
    if (!symbol) {
      return payment;
    }

    return {
      ...payment,
      token: symbol,
    };
  });
}
