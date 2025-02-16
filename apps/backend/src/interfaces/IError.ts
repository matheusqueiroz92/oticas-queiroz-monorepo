export interface IError extends Error {
  statusCode?: number;
  code?: string;
}
