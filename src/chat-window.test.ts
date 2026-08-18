import { buildChatWindow, getTrackerText } from './chat-window.js';

describe('getTrackerText', () => {
  it('drops a hidden message when hidden messages are not included', () => {
    expect(getTrackerText({ mes: 'secret', is_system: true }, false)).toBeNull();
  });

  it('keeps a hidden message when hidden messages are included', () => {
    expect(getTrackerText({ mes: 'secret', is_system: true }, true)).toBe('secret');
  });

  it('drops a generated image message entirely', () => {
    const msg = { mes: '![generated image](/user/images/Yelena/imagine_1787091073720_0.webp)', is_system: true };
    expect(getTrackerText(msg, true)).toBeNull();
  });

  it('drops an image whose path has percent-encoded parens', () => {
    const msg = { mes: '![generated image](/user/images/Yelena%20%28alt%29/imagine_1_0.png)', is_system: true };
    expect(getTrackerText(msg, true)).toBeNull();
  });

  it('drops a raw html media message', () => {
    expect(getTrackerText({ mes: '<img src="/user/images/x.webp">', is_system: true }, true)).toBeNull();
  });

  it('drops a native ST attachment whose text is only the generation prompt', () => {
    const msg = { mes: 'a photo of a cat', extra: { media: [{}], inline_image: false } };
    expect(getTrackerText(msg, true)).toBeNull();
  });

  it('keeps the prose of a message that also carries an inline image', () => {
    const msg = { mes: 'She smiled at the camera.\n\n![shot](/user/images/y.png)' };
    expect(getTrackerText(msg, true)).toBe('She smiled at the camera.');
  });

  it('keeps an ordinary message unchanged', () => {
    expect(getTrackerText({ mes: 'Yelena crossed the room.' }, true)).toBe('Yelena crossed the room.');
  });
});

describe('buildChatWindow', () => {
  // The bug this module exists to prevent: the old code flipped chat[i].is_system to
  // false so buildPrompt would include hidden messages, and a chat save landing inside
  // that window persisted the flag, permanently unhiding other extensions' messages.
  it('never mutates the chat it reads', () => {
    const chat = [{ mes: 'a', is_system: true }, { mes: 'b' }];
    buildChatWindow(chat, 0, 1, { includeHidden: true, includeNames: false });
    expect(chat[0].is_system).toBe(true);
  });

  it('reads the window inclusively from start to end', () => {
    const chat = [{ mes: 'a' }, { mes: 'b' }, { mes: 'c' }, { mes: 'd' }];
    const out = buildChatWindow(chat, 1, 2, { includeHidden: false, includeNames: false });
    expect(out.map((m) => m.content)).toEqual(['b', 'c']);
  });

  it('maps user messages to the user role and the rest to assistant', () => {
    const chat = [{ mes: 'hi', is_user: true }, { mes: 'hello', is_user: false }];
    const out = buildChatWindow(chat, 0, 1, { includeHidden: false, includeNames: false });
    expect(out.map((m) => m.role)).toEqual(['user', 'assistant']);
  });

  it('prefixes the speaker name when names are included', () => {
    const chat = [{ mes: 'hello', name: 'Yelena' }];
    const out = buildChatWindow(chat, 0, 0, { includeHidden: false, includeNames: true });
    expect(out[0].content).toBe('Yelena: hello');
  });

  it('leaves no gap where a skipped message was', () => {
    const chat = [
      { mes: 'before' },
      { mes: '![generated image](/user/images/Yelena/imagine_1_0.webp)', is_system: true },
      { mes: 'after' },
    ];
    const out = buildChatWindow(chat, 0, 2, { includeHidden: true, includeNames: false });
    expect(out.map((m) => m.content)).toEqual(['before', 'after']);
  });

  it('carries extra through so earlier trackers can still be found', () => {
    const chat = [{ mes: 'hi', extra: { wtracker: { value: 1 } } }];
    const out = buildChatWindow(chat, 0, 0, { includeHidden: false, includeNames: false });
    expect(out[0].extra).toEqual({ wtracker: { value: 1 } });
  });

  it('tolerates a window that runs past the end of the chat', () => {
    const chat = [{ mes: 'only' }];
    const out = buildChatWindow(chat, 0, 4, { includeHidden: false, includeNames: false });
    expect(out.map((m) => m.content)).toEqual(['only']);
  });
});
