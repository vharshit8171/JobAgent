type TokenGetter = () => Promise<string | null>;

let getter: TokenGetter | null = null;

export function setTokenGetter(fn: TokenGetter | null) {
  getter = fn;
}

export async function getAuthToken(): Promise<string | null> {
  return (await getter?.()) ?? null;
}