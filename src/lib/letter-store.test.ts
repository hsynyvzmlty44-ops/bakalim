import assert from "node:assert/strict";
import test from "node:test";
import { createClient, type User } from "@supabase/supabase-js";
import { fetchLetterRemote, saveLetterRemote, readLocalLetter, writeLocalLetter, LETTER_STORAGE_KEY, type Letter } from "./letter-store";

test("legacy text, blank greeting and deliberately cleared letters survive reload", () => {
  const values = new Map([
    ["lila-kopru-letter-v1", "Yeni mektubum\n\n🤍"],
    ["lila-kopru-letter-greeting-v1", ""],
  ]);
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  assert.deepEqual(readLocalLetter(storage), { greeting: "", content: "Yeni mektubum\n\n🤍" });
  writeLocalLetter(storage, { greeting: "", content: "" });
  assert.deepEqual(readLocalLetter(storage), { greeting: "", content: "" });
  values.set(LETTER_STORAGE_KEY, "broken JSON");
  assert.equal(readLocalLetter(storage)?.content, "Yeni mektubum\n\n🤍");
  assert.equal(readLocalLetter({ getItem: () => null }), null);
});

test("a new device reads the latest shared letter, including intentional empty content", async () => {
  let stored: Letter | null = null;
  const makeClient = () => {
    const client = createClient("https://example.supabase.co", "test-key", {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: async (_input, init) => {
        if (init?.method === "POST") stored = JSON.parse(init.body as string);
        const result = init?.method === "POST" ? stored : stored ? [stored] : [];
        return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
      } },
    });
    client.auth.getUser = async () => ({ data: { user: { id: "shared-user" } as User }, error: null });
    return client;
  };
  assert.equal(await fetchLetterRemote(makeClient()), null);
  await saveLetterRemote(makeClient(), { greeting: "Yavrum,", content: "Son mektup 🤍" });
  assert.equal((await fetchLetterRemote(makeClient()))?.content, "Son mektup 🤍");
  await saveLetterRemote(makeClient(), { greeting: "", content: "" });
  assert.equal((await fetchLetterRemote(makeClient()))?.content, "");
});

test("failed or unconfirmed shared writes never report success", async () => {
  for (const status of [403, 200]) {
    const client = createClient("https://example.supabase.co", "test-key", {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: async () => new Response(JSON.stringify(status === 403 ? { message: "denied" } : { greeting: "old", content: "old" }), { status, headers: { "Content-Type": "application/json" } }) },
    });
    client.auth.getUser = async () => ({ data: { user: { id: "shared-user" } as User }, error: null });
    await assert.rejects(saveLetterRemote(client, { greeting: "", content: "new" }));
    if (status === 403) await assert.rejects(fetchLetterRemote(client));
  }
});
