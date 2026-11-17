import type { SupabaseClient } from "@supabase/supabase-js";

export type Letter = { greeting: string; content: string };
export const LETTER_STORAGE_KEY = "lila-kopru-letter-v2";

export function readLocalLetter(storage: Pick<Storage, "getItem">): Letter | null {
  const current = storage.getItem(LETTER_STORAGE_KEY);
  if (current !== null) {
    try {
      const value = JSON.parse(current);
      if (typeof value?.greeting === "string" && typeof value?.content === "string") return value;
    } catch { /* Keep the original saved text when a newer local record is damaged. */ }
  }
  const content = storage.getItem("lila-kopru-letter-v1");
  return content === null ? null : {
    content,
    greeting: storage.getItem("lila-kopru-letter-greeting-v1") ?? "Sevgilim,",
  };
}

export function writeLocalLetter(storage: Pick<Storage, "setItem">, letter: Letter) {
  // Atomic write; the old keys remain intact as a migration backup.
  storage.setItem(LETTER_STORAGE_KEY, JSON.stringify(letter));
}

export async function fetchLetterRemote(client: SupabaseClient): Promise<Letter | null> {
  const { data, error } = await client.from("couple_letters")
    .select("greeting,content").abortSignal(AbortSignal.timeout(12000)).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveLetterRemote(client: SupabaseClient, letter: Letter): Promise<Letter> {
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) throw authError ?? new Error("Oturum bulunamadı.");
  const { data, error } = await client.from("couple_letters").upsert({
    user_id: user.id,
    greeting: letter.greeting,
    content: letter.content,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" }).select("greeting,content")
    .abortSignal(AbortSignal.timeout(12000)).single();
  if (error) throw error;
  if (!data || data.content !== letter.content || data.greeting !== letter.greeting) {
    throw new Error("Mektup kaydı doğrulanamadı.");
  }
  return data;
}
