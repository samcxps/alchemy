import type { Context } from "../context";
import { Resource } from "../resource";
import { type Secret, secret } from "../secret";
import {
  createResendClient,
  ResendApiError,
  type ResendClientOptions,
} from "./client";

/**
 * Options for creating a Resend API key
 */
export interface ResendApiKeyOptions extends ResendClientOptions {
	/**
	 * The name of the API key
	 *
	 * @default `${app}-${stage}-${id}`
	 */
	name?: string;

	/**
	 * The API key can have full access to Resend’s API or be only restricted to send emails.
	 * * full_access: Can create, delete, get, and update any resource.
	 * * sending_access: Can only send emails.
	 *
	 * @default "full_access"
	 */
	permission?: "full_access" | "sending_access";

	/**
	 * Restrict an API key to send emails only from a specific domain.
	 * This is only used when the permission is set to sending_access.
	 */
	domainId?: string;
}

/**
 * Resend API key
 */
export interface ResendApiKey {
	/**
	 * The Resend ID of the created API key
	 */
	id: string;

	/**
	 * The name of the API key
	 */
	name: string;

	/**
	 * The permission of the API key
	 */
	permission: "full_access" | "sending_access";

	/**
	 * The domain ID of the API key
	 */
	domainId?: string;

	/**
	 * The created API key token
	 */
	token: Secret;
}

export const ApiKey = Resource(
	"resend::ApiKey",
	async function (
		this: Context<ResendApiKey>,
		id: string, // this is the Alchemy ID - not to be confused with the Resend API key ID
		props: ResendApiKeyOptions = {},
	): Promise<ResendApiKey> {
		const client = await createResendClient({
			apiKey: props?.apiKey,
		});

		// Delete phase
		if (this.phase === "delete") {
			const { error } = await client.apiKeys.remove(this.output.id);

			if (error) {
				throw new ResendApiError(error);
			}

			return this.destroy();
		}

		// Create phase
		if (this.phase === "create") {
			const name = props.name ?? this.scope.createPhysicalName(id);
			const permission = props.permission ?? "full_access";
			const domainId = props.domainId;

			const { data, error } = await client.apiKeys.create({
				name,
				permission,
				domain_id: domainId,
			});
			if (error) {
				throw new ResendApiError(error);
			}

			return {
				id: data.id,
				name,
				permission,
				token: secret(data.token),
				domainId,
			};
		}

		// Update phase - just return the existing resource
		if (this.phase === "update") {
			console.warn(
				"Warning: Updating Resend API key is not supported. No changes will be made.",
			);

			return this.output;
		}

		throw new Error("Invalid phase");
	},
);
