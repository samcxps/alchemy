import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { createResendClient } from "../../src/resend";
import type { ResendApiKey } from "../../src/resend/api-key.ts";
import { ApiKey } from "../../src/resend/api-key.ts";
import "../../src/test/vitest";
import { BRANCH_PREFIX } from "../util.ts";

const client = await createResendClient();

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("ResendApiKey Resource", () => {
  test("create, update, and delete resend api key", async (scope) => {
    let resource: ResendApiKey | undefined;

    const testId = `${BRANCH_PREFIX}-test-api-key`;

    try {
      // create resource
      resource = await ApiKey(testId);
      const originalResource = resource;

      expect(resource.id).toBeTruthy();
      expect(resource.permission).toBe("full_access");
      expect(resource.token).toBeTruthy();
      expect(resource.domainId).toBeUndefined();

      // verify resource was created by querying the API directly
      const listResponse = await client.apiKeys.list();
      expect(listResponse.data?.data.length).toBeGreaterThan(0);

      const createdResource = listResponse.data?.data.find(
        (key) => key.name === resource?.name,
      );
      expect(createdResource).toBeTruthy();
      expect(createdResource?.id).toBe(resource?.id);

      // api key does not support updating, so lets make sure no changes are made if we try
      resource = await ApiKey(testId, {
        name: "updated-api-key",
        permission: "sending_access",
      });

      // make sure no changes were made to the resource after trying to update it
      expect(resource.id).toBe(originalResource.id);
      expect(resource.name).toBe(originalResource.name);
      expect(resource.permission).toBe(originalResource.permission);
      expect(resource.token.unencrypted).toBe(
        originalResource.token.unencrypted,
      );
      expect(resource.domainId).toBe(originalResource.domainId);
    } catch (err) {
      console.log(err);
      throw err;
    } finally {
      // cleanup and delete resource
      await destroy(scope);

      // verify resource was deleted by querying the API directly
      const listResponse = await client.apiKeys.list();
      const deletedResource = listResponse.data?.data.find(
        (key) => key.name === resource?.name,
      );
      expect(deletedResource).toBeUndefined();
    }
  });
});
