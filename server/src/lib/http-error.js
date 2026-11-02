export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details);
export const unauthorized = (message = "Please sign in") => new HttpError(401, message);
export const forbidden = (message = "You don't have access to this") => new HttpError(403, message);
export const notFoundError = (what = "Resource") => new HttpError(404, `${what} not found`);
export const conflict = (message) => new HttpError(409, message);
