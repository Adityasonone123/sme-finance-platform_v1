export interface RootResponse {
  message: string;
  version: string;
  environment: string;
}

export interface HealthResponse {
  status: string;
  message: string;
  database?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}
