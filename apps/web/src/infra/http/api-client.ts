import { err, ok, type Result } from "neverthrow";
import { ApiError } from "@/infra/http/api-error";
import {
  applyObservabilityHeaders,
  createRequestId,
  incomingRequestId,
  logClientRequest,
} from "@/infra/http/observability";

export type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";

export type QueryValue = string | number | boolean | undefined;

export interface ApiClientConfig {
  baseUrl: string;
  timeoutMs?: number;
  getAccessToken?: () => string | Promise<string | undefined> | undefined;
  refreshEndpoint?: string;
  onUnauthorized?: () => void;
}

export type ApiSuccess<T> = {
  data: T;
  headers: Headers;
  status: number;
};

export type ApiRequestOptions = {
  headers?: HeadersInit;
  signal?: AbortSignal;
  timeoutMs?: number;
};

type RequestParams<TBody> = {
  method: ApiMethod;
  path: string;
  query?: Record<string, QueryValue>;
  body?: TBody;
  headers?: HeadersInit;
  signal?: AbortSignal;
  timeoutMs?: number;
  _retryUnauthorized?: boolean;
};

const DEFAULT_TIMEOUT_MS = 15_000;

export class ApiClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly getAccessToken?: ApiClientConfig["getAccessToken"];
  private readonly refreshEndpoint: string;
  private readonly onUnauthorized?: () => void;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.getAccessToken = config.getAccessToken;
    this.refreshEndpoint = config.refreshEndpoint ?? "/api/auth/refresh";
    this.onUnauthorized = config.onUnauthorized;
  }

  get<TResponse>(
    path: string,
    query?: Record<string, QueryValue>,
    options?: ApiRequestOptions,
  ) {
    return this.request<TResponse>({
      method: "GET",
      path,
      query,
      ...options,
    });
  }

  post<TResponse, TBody = undefined>(
    path: string,
    body?: TBody,
    options?: ApiRequestOptions,
  ) {
    return this.request<TResponse, TBody>({
      method: "POST",
      path,
      body,
      ...options,
    });
  }

  put<TResponse, TBody = undefined>(
    path: string,
    body?: TBody,
    options?: ApiRequestOptions,
  ) {
    return this.request<TResponse, TBody>({
      method: "PUT",
      path,
      body,
      ...options,
    });
  }

  patch<TResponse, TBody = undefined>(
    path: string,
    body?: TBody,
    options?: ApiRequestOptions,
  ) {
    return this.request<TResponse, TBody>({
      method: "PATCH",
      path,
      body,
      ...options,
    });
  }

  delete<TResponse>(path: string, options?: ApiRequestOptions) {
    return this.request<TResponse>({
      method: "DELETE",
      path,
      ...options,
    });
  }

  private async request<TResponse, TBody = undefined>(
    params: RequestParams<TBody>,
  ): Promise<Result<ApiSuccess<TResponse>, ApiError>> {
    const startedAt = performance.now();
    const requestId = (await incomingRequestId()) ?? createRequestId();
    const pathname = pathWithoutQuery(params.path);

    try {
      const response = await this.send(params, requestId);
      const text = await response.text();
      const data = text ? safeJsonParse(text) : null;

      await logClientRequest({
        requestId,
        method: params.method,
        path: pathname,
        status: response.status,
        durationMs: performance.now() - startedAt,
      });

      if (response.ok) {
        return ok({
          data: data as TResponse,
          headers: response.headers,
          status: response.status,
        });
      }

      const apiError = new ApiError(
        response.status,
        response.statusText || `Request failed (${response.status})`,
        data,
      );

      if (response.status === 401) {
        return this.handleUnauthorized(params, apiError);
      }

      return err(apiError);
    } catch (error) {
      const apiError =
        error instanceof ApiError
          ? error
          : toNetworkError(error);

      await logClientRequest({
        requestId,
        method: params.method,
        path: pathname,
        status: apiError.status,
        durationMs: performance.now() - startedAt,
        error,
      });

      return err(apiError);
    }
  }

  private async send<TBody>(
    params: RequestParams<TBody>,
    requestId: string,
  ): Promise<Response> {
    const headers = await this.buildHeaders(params.headers, params.body);
    applyObservabilityHeaders(headers, requestId);

    return fetch(this.buildUrl(params.path, params.query), {
      method: params.method,
      credentials: "include",
      cache: "no-store",
      headers,
      body: encodeBody(params.body),
      signal: mergeAbortSignals(
        params.signal,
        params.timeoutMs ?? this.timeoutMs,
      ),
    });
  }

  private async handleUnauthorized<TResponse, TBody>(
    params: RequestParams<TBody>,
    originalError: ApiError,
  ): Promise<Result<ApiSuccess<TResponse>, ApiError>> {
    const canTryRefresh =
      !params._retryUnauthorized && !this.isRefreshRequest(params.path);

    if (canTryRefresh) {
      const refreshed = await this.refreshTokenQueued();
      if (refreshed) {
        return this.request<TResponse, TBody>({
          ...params,
          _retryUnauthorized: true,
        });
      }
    }

    this.onUnauthorized?.();
    return err(originalError);
  }

  private async buildHeaders(
    extra?: HeadersInit,
    body?: unknown,
  ): Promise<Headers> {
    const headers = new Headers(extra);
    const token = this.getAccessToken ? await this.getAccessToken() : undefined;

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (body !== undefined && !(body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return headers;
  }

  private buildUrl(
    path: string,
    query?: Record<string, QueryValue>,
  ): string {
    const url = new URL(`${this.baseUrl}${path}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private async tryRefreshToken(): Promise<boolean> {
    const response = await fetch(this.refreshEndpoint, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });

    return response.ok;
  }

  private refreshTokenQueued(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.tryRefreshToken()
        .catch(() => false)
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    return this.refreshPromise;
  }

  private isRefreshRequest(path: string): boolean {
    const requestPathname = new URL(path, "http://local").pathname;
    const refreshPathname = new URL(this.refreshEndpoint, "http://local")
      .pathname;
    return requestPathname === refreshPathname;
  }
}

function encodeBody(body: unknown): BodyInit | undefined {
  if (body === undefined) {
    return undefined;
  }

  if (body instanceof FormData || typeof body === "string") {
    return body;
  }

  return JSON.stringify(body);
}

function mergeAbortSignals(
  signal: AbortSignal | undefined,
  timeoutMs: number,
): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

function toNetworkError(error: unknown): ApiError {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return new ApiError(0, "Request timed out", error);
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return new ApiError(0, "Request aborted", error);
  }

  return new ApiError(0, "Network error", error);
}

function pathWithoutQuery(path: string): string {
  return path.split("?")[0] ?? path;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
