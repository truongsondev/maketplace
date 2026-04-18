const LOCAL_API_BASE_URL = "http://localhost:8080";

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function buildApiUrlFromWindow(): string {
  if (typeof window === "undefined") {
    return LOCAL_API_BASE_URL;
  }

  const { protocol, hostname } = window.location;
  const apiProtocol = protocol === "https:" ? "https:" : "http:";
  return `${apiProtocol}//${hostname}:8080`;
}

export function resolveApiBaseUrl(): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return trimTrailingSlash(configuredBaseUrl);
  }

  return trimTrailingSlash(buildApiUrlFromWindow());
}
