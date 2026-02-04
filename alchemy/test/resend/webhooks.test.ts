import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy";
import { destroy } from "../../src/destroy";
import { createResendClient } from "../../src/resend/client";
import type { ResendWebhook } from "../../src/resend/webhook";
import { Webhook } from "../../src/resend/webhook";
import "../../src/test/vitest";
import { BRANCH_PREFIX } from "../util";

const client = await createResendClient();

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("ResendWebhook Resource", () => {
  test("create, update, and delete webhook", async (scope) => {
    let webhook: ResendWebhook | undefined;

    const testWebhookId = `${BRANCH_PREFIX}-test-webhook`;

    try {
      // Create a test webhook
      webhook = await Webhook(testWebhookId, {
        endpoint: "https://example.com/webhook",
        events: ["email.sent"],
        status: "enabled",
      });
      expect(webhook.id).toBeTruthy();
      expect(webhook.endpoint).toBe("https://example.com/webhook");
      expect(webhook.events).toEqual(["email.sent"]);
      expect(webhook.status).toBe("enabled");
      expect(webhook.signingSecret).toBeTruthy();


      // Verify webhook was created by querying the Resend API directly 
      const getResponse = await client.webhooks.get(webhook.id);
      expect(getResponse.data?.id).toBe(webhook.id);
      expect(getResponse.data?.endpoint).toBe(webhook.endpoint);
      expect(getResponse.data?.events).toEqual(["email.sent"]);
      expect(getResponse.data?.status).toBe("enabled");
      expect(getResponse.data?.signing_secret).toBe(webhook.signingSecret.unencrypted);

      // Update the webhook
      webhook = await Webhook(testWebhookId, {
        endpoint: "https://example.com/webhook-updated",
        events: ["email.sent", "email.delivered"],
        status: "disabled",
      });
      expect(webhook.id).toBeTruthy();
      expect(webhook.endpoint).toBe("https://example.com/webhook-updated");
      expect(webhook.events).toEqual(["email.sent", "email.delivered"]);
      expect(webhook.status).toBe("disabled");
      expect(webhook.signingSecret).toBeTruthy();

      // Verify webhook was updated by querying the Resend API directly
      const getResponseUpdated = await client.webhooks.get(webhook.id);
      expect(getResponseUpdated.data?.id).toBe(webhook.id);
      expect(getResponseUpdated.data?.endpoint).toBe(webhook.endpoint);
      expect(getResponseUpdated.data?.events).toEqual(["email.sent", "email.delivered"]);
      expect(getResponseUpdated.data?.status).toBe("disabled");
      expect(getResponseUpdated.data?.signing_secret).toBe(webhook.signingSecret.unencrypted);

    } finally {
      await destroy(scope);
    }
  });
});
