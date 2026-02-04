import { type ErrorResponse, Resend } from "resend";
import { alchemy } from "../alchemy.ts";
import type { Secret } from "../secret.ts";

/**
 * Configuration options for the Resend webhook client
 */
export interface ResendClientOptions {
  /**
   * The API key to use for the Resend webhook client. Defaults to the value of the RESEND_API_KEY environment variable.
   */
  apiKey?: Secret;
}

/**
 * Resend API error
 */
export class ResendApiError extends Error {
  name: ErrorResponse["name"];
  message: ErrorResponse["message"];
  statusCode: ErrorResponse["statusCode"];

  constructor(response: ErrorResponse) {
    super(`Resend client error: ${response.statusCode}: ${response.message}`);
    this.name = response.name;
    this.message = response.message;
    this.statusCode = response.statusCode;
  }
}

/**
 * Create a Resend client
 *
 * The Resend SDK automatically looks for these environment variables:
 * - RESEND_API_KEY
 *
 * You can override them by passing values in the options.
 *
 * @param options Options for creating the Resend client
 * @returns Resend client
 */
export async function createResendClient(
  options: ResendClientOptions = {},
): Promise<Resend> {
  const apiKey = options.apiKey ?? alchemy.secret.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Resend API key is required. Provide it via the apiKey parameter or set the RESEND_API_KEY environment variable.",
    );
  }

  return new Resend(apiKey.unencrypted);
}
