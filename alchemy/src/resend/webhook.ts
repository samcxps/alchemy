import { alchemy } from "../alchemy";
import type { Context } from "../context";
import { Resource } from "../resource";
import type { Secret } from "../secret";
import {
    createResendClient,
    ResendApiError,
    type ResendClientOptions,
} from "./client";

const EMAIL_EVENTS = [
  "email.bounced",
  "email.clicked",
  "email.complained",
  "email.delivered",
  "email.delivery_delayed",
  "email.failed",
  "email.opened",
  "email.received",
  "email.scheduled",
  "email.sent",
  "email.suppressed",
] as const;

const DOMAIN_EVENTS = [
  "domain.created",
  "domain.updated",
  "domain.deleted",
] as const;

const CONTACT_EVENTS = [
  "contact.created",
  "contact.updated",
  "contact.deleted",
] as const;

const EVENT_TYPES = [
  ...EMAIL_EVENTS,
  ...DOMAIN_EVENTS,
  ...CONTACT_EVENTS,
] as const;

/**
 * Options for creating a Resend webhook
 */
export interface ResendWebhookOptions extends ResendClientOptions {
  /**
   * The URL where webhook events will be sent.
   */
  endpoint: string;

  /**
   *  Array of event types to subscribe to.
   *
   * @default all event types
   * @see https://resend.com/docs/webhooks/event-types
   */
  events: (typeof EVENT_TYPES)[number][];

  /**
   * The status of the webhook.
   *
   * @default "enabled"
   */
  status: "enabled" | "disabled";
}

export interface ResendWebhook {
  /**
   * The Resend ID of the created webhook
   */
  id: string;

  /**
   * The URL where webhook events will be sent.
   */
  endpoint: string;

  /**
   * The event types that the webhook is subscribed to.
   *
   * @see https://resend.com/docs/webhooks/event-types
   */
  events: (typeof EVENT_TYPES)[number][];

  /**
   * The status of the webhook.
   */
  status: "enabled" | "disabled";

  /**
   * The signing secret for the webhook.
   */
  signingSecret: Secret;
}

export const Webhook = Resource(
  "resend::Webhook",
  async function (
    this: Context<ResendWebhook>,
    _id: string,
    props: ResendWebhookOptions,
  ): Promise<ResendWebhook> {
    const client = await createResendClient({ apiKey: props.apiKey });

    // Delete phase
    if (this.phase === "delete") {
      const { error } = await client.webhooks.remove(this.output.id);

      if (error) {
        throw new ResendApiError(error);
      }

      return this.destroy();
    }

    // Create phase
    if (this.phase === "create") {
      const { data, error } = await client.webhooks.create({
        endpoint: props.endpoint,
        events: props.events,
      });

      if (error) {
        throw new ResendApiError(error);
      }

      return {
        id: data.id,
        endpoint: props.endpoint,
        status: props.status ?? "enabled",
        events: props.events ?? EVENT_TYPES,
        signingSecret: alchemy.secret(data.signing_secret),
      };
    }

    // Update phase
    if (this.phase === "update") {
      const { data, error } = await client.webhooks.update(this.output.id, {
        endpoint: props.endpoint ?? this.output.endpoint,
        events: props.events ?? this.output.events,
        status: props.status ?? this.output.status,
      });

      if (error) {
        throw new ResendApiError(error);
      }

      return {
        id: data.id,
        endpoint: props.endpoint ?? this.output.endpoint,
        status: props.status ?? "enabled",
        events: props.events ?? this.output.events,
        signingSecret: this.output.signingSecret,
      };
    }

    throw new Error("Invalid phase");
  },
);
