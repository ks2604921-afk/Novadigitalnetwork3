// Server-only storage adapter layer. Every provider plugs in behind StorageAdapter,
// so the admin UI and database never depend on a specific vendor.
import { STORAGE_PROVIDERS, type ProcessingJobType, type ProviderId, type ProviderInfo } from "./catalog";

export type SignedUpload = {
  url: string;
  method: "PUT" | "POST";
  headers: Record<string, string>;
  /** For form-based (POST) uploads. */
  fields?: Record<string, string>;
  expiresAt: string;
};

export interface StorageAdapter {
  readonly info: ProviderInfo;
  /** True once real provider code has been written for this adapter. */
  readonly implemented: boolean;
  /** Secret names (never values) that are not set. */
  missingSecrets(): string[];
  testConnection(): Promise<{ ok: boolean; message: string }>;
  createSignedUpload(input: { key: string; mimeType: string; sizeBytes: number }): Promise<SignedUpload>;
  createSignedPlayback(input: { key: string; expiresInSeconds: number }): Promise<{ url: string; expiresAt: string }>;
  deleteObject(key: string): Promise<void>;
  /** Optional: hand the original to the provider's transcoder. Return provider job ids. */
  submitProcessing?(input: { key: string; jobs: ProcessingJobType[] }): Promise<Array<{ type: ProcessingJobType; providerJobId: string }>>;
}

export class StorageUnavailableError extends Error {}

/**
 * Placeholder used until a provider is chosen. It reports real configuration
 * state and refuses every storage operation — it never pretends to succeed.
 */
class NotYetImplementedAdapter implements StorageAdapter {
  readonly implemented = false;
  constructor(readonly info: ProviderInfo) {}

  missingSecrets() {
    return this.info.secrets.filter((name) => !process.env[name]);
  }

  async testConnection() {
    const missing = this.missingSecrets();
    if (missing.length) return { ok: false, message: `Missing secrets: ${missing.join(", ")}` };
    return {
      ok: false,
      message: `Credentials are present, but the ${this.info.name} adapter has not been built yet.`,
    };
  }

  private refuse(): never {
    throw new StorageUnavailableError(`${this.info.name} storage is not connected yet.`);
  }
  async createSignedUpload(): Promise<SignedUpload> {
    this.refuse();
  }
  async createSignedPlayback(): Promise<{ url: string; expiresAt: string }> {
    this.refuse();
  }
  async deleteObject(): Promise<void> {
    this.refuse();
  }
}

// To integrate a provider: implement StorageAdapter in ./providers/<id>.server.ts
// and register it here in place of NotYetImplementedAdapter.
const registry: Record<ProviderId, StorageAdapter> = Object.fromEntries(
  STORAGE_PROVIDERS.map((p) => [p.id, new NotYetImplementedAdapter(p)]),
) as unknown as Record<ProviderId, StorageAdapter>;

export function getAdapter(id: ProviderId): StorageAdapter {
  return registry[id];
}
