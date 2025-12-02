import axios, {
  AxiosRequestConfig,
  RawAxiosRequestHeaders,
  AxiosError,
} from "axios";
import { _DEV, APP_CONSTANTS } from "../../constants";

interface RequestOptions extends AxiosRequestConfig {
  secured?: boolean;
  headers?: RawAxiosRequestHeaders;
  abortController?: AbortController;
  retries?: number; // Number of retry attempts for transient errors
}

interface ApiResponse<T> {
  data: T;
  status: number;
  headers: RawAxiosRequestHeaders;
}

const DEFAULT_RETRIES = 3;
const RETRYABLE_STATUS_CODES = [429, 502, 503, 504];

const ApiClient = {
  request: async <T>({
    url,
    method,
    data = null,
    errorMessage,
    secured = false,
    options = {},
    includeBaseUrl = false,
    headers = {},
    retries = DEFAULT_RETRIES,
  }: {
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    data?:
      | Record<string, unknown>
      | FormData
      | Record<string, unknown>[]
      | unknown[]
      | number
      | string
      | null
      | object;
    errorMessage: string;
    secured?: boolean;
    options?: RequestOptions;
    includeBaseUrl?: boolean;
    headers?: RawAxiosRequestHeaders;
    retries?: number;
  }): Promise<T> => {
    const requestUrl = includeBaseUrl ? `${APP_CONSTANTS.baseUrl}${url}` : url;

    const mergedHeaders: RawAxiosRequestHeaders = {
      Accept: "application/json, text/plain",
      ...headers,
      ...(options.headers ?? {}),
    };

    if (secured) {
      const authToken = getAppInstance();
      if (!authToken) {
        throw new Error("Authorization token is missing");
      }
      mergedHeaders["Authorization"] = authToken;
    }

    const config: AxiosRequestConfig = {
      method,
      url: requestUrl,
      maxBodyLength: Infinity,
      headers: mergedHeaders,
      signal: options.abortController?.signal,
      ...options,
    };

    if (method !== "GET" && data) {
      config.data = data;
    }

    try {
      const response = await retryRequest<T>(config, retries);
      // Return the actual API payload if wrapped in { data: ... }
      if (
        response.data &&
        typeof response.data === "object" &&
        "data" in response.data
      ) {
        return (response.data as any).data;
      }
      return response.data;
    } catch (error) {
      handleRequestError(error, method, requestUrl, errorMessage);
    }
  },
};

async function retryRequest<T>(
  config: AxiosRequestConfig,
  retries: number
): Promise<ApiResponse<T>> {
  let lastError: AxiosError | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await axios(config);
    } catch (error) {
      lastError = error as AxiosError;
      if (
        axios.isAxiosError(error) &&
        error.response &&
        RETRYABLE_STATUS_CODES.includes(error.response.status) &&
        attempt < retries
      ) {
        const delay = Math.pow(2, attempt) * 100; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

function handleRequestError(
  error: unknown,
  method: string,
  url: string,
  errorMessage: string
): never {
  console.error(`Error during ${method} request to ${url}`, error);

  // Log to a centralized service (e.g., Sentry) in production
  if (!_DEV) {
    // Example: Sentry.captureException(error);
    console.log("Logging error to monitoring service");
  }

  if (axios.isAxiosError(error) && error.response) {
    const status = error.response.status;
    const message =
      error.response.data?.message ||
      errorMessage ||
      `Request failed with status ${status}`;
    throw new Error(`${message} (Status: ${status})`);
  } else if (axios.isCancel(error)) {
    throw new Error("Request was cancelled");
  } else {
    throw new Error(errorMessage || "An unexpected error occurred");
  }
}

export function getAppInstance(): string | null {
  return new URLSearchParams(window.location.search).get("instance") || null;
}

export default ApiClient;
