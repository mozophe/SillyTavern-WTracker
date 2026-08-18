/**
 * The chat window fed to a tracker generation.
 *
 * buildPrompt() reads SillyTavern's live chat itself and hard-filters is_system with no
 * opt-out, so the only way to make it see hidden messages was to flip chat[i].is_system
 * across an await. Any chat save landing inside that window persisted `false` to the
 * .jsonl, and a reloadCurrentChat() in the same window swapped the chat array so the
 * restore landed on dead object references — permanently unhiding messages that other
 * extensions had hidden.
 *
 * Owning the loop turns "include hidden" back into a parameter instead of a mutation, and
 * gives us one place to drop attachments the tracker model cannot read anyway.
 */

/** The fields we read off a chat message. The real ChatMessage carries far more. */
export interface WindowMessage {
  mes?: string;
  name?: string;
  is_user?: boolean;
  is_system?: boolean;
  extra?: Record<string, any>;
}

export interface WindowEntry {
  role: 'user' | 'assistant';
  content: string;
  extra?: Record<string, any>;
}

/** The text a message contributes to a tracker prompt, or null if it contributes nothing. */
export function getTrackerText(msg: WindowMessage | null | undefined, includeHidden: boolean): string | null {
  if (!msg) return null;

  // "Hidden" is is_system. /hide sets it, and so does every extension that pulls old
  // messages out of context.
  if (msg.is_system && !includeHidden) return null;

  // Native ST attachments live in extra.media; inline_image false means the media IS the
  // message and its text is only the prompt that generated it.
  if (msg.extra?.media?.length && msg.extra.inline_image === false) return null;

  // Other extensions write the attachment into the body as markdown or raw HTML instead.
  // A message that is nothing but an attachment strips to empty and drops out entirely.
  const text = (msg.mes || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/<(img|video|audio)\b[^>]*>(?:<\/\1>)?/gi, '')
    .trim();

  return text || null;
}

/** Build the tracker's chat window from chat[start..end], inclusive. Read-only. */
export function buildChatWindow(
  chat: WindowMessage[],
  start: number,
  end: number,
  { includeHidden, includeNames }: { includeHidden: boolean; includeNames: boolean },
): WindowEntry[] {
  const out: WindowEntry[] = [];
  for (let i = start; i <= end; i++) {
    const msg = chat[i];
    const text = getTrackerText(msg, includeHidden);
    if (text === null) continue;
    out.push({
      role: msg.is_user ? 'user' : 'assistant',
      content: includeNames ? `${msg.name}: ${text}` : text,
      // includeWTrackerMessages() reads .extra to find earlier trackers to replay.
      extra: msg.extra,
    });
  }
  return out;
}
