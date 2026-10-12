// Same marker TunnelVision uses (turn-classification.js), so both extensions
// agree on what an out-of-character turn is: a case-insensitive OOC as the
// complete first word, optionally wrapped — `(OOC: ...)`, `((OOC: ...))`,
// `[OOC: ...]`, `<OOC> ...`, `**OOC** ...`. Bare brackets and "OOCly" do not
// match; those are action beats and ordinary prose.
export function isOocMessage(text: unknown): boolean {
  return /^[\s(\[<*]*OOC\b/i.test(String(text ?? ''));
}

// Whether the message at `messageId` belongs to an OOC turn: it is, or replies
// to, a user message that starts with OOC.
export function isOocTurn(chat: Array<{ is_user?: boolean; mes?: string }>, messageId: number): boolean {
  for (let i = messageId; i >= 0; i--) {
    if (chat[i]?.is_user === true) {
      return isOocMessage(chat[i].mes);
    }
  }
  return false;
}
