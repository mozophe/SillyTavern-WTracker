# SillyTavern WTracker

## Overview

A [SillyTavern](https://docs.sillytavern.app/) extension that helps you track your chat stats with LLMs using [connection profiles](https://docs.sillytavern.app/usage/core-concepts/connection-profiles/).

![popup](images/overview.png)

---

**You can edit the schema for active chat.**

![modify_for_this_chat](images/modify_for_this_chat.png)

---

![settings](images/settings.gif)

---

**If you are using a _Text Completion_ profile, make sure your profile contains API, preset, model, and instruct.**

**If you are using a _Chat Completion_ profile; API, settings, model would be enough.**

---

## What this fork changes

This is a fork of [bmen25124/SillyTavern-WTracker](https://github.com/bmen25124/SillyTavern-WTracker). The upstream extension is unchanged in spirit — same minimal tracker, same connection-profile approach — but this fork fixes how the tracker prompt is assembled and makes the output usable as input for other extensions.

**Prompt assembly**

- The tracker builds its own chat window instead of letting `buildPrompt` slice the chat. Upstream had to flip `is_system` on live messages across an `await` to see hidden messages, which could permanently unhide messages other extensions had hidden.
- Attachments (images, video, audio — native `extra.media` or markdown/HTML in the body) are dropped from the window; the tracker model can't read them anyway.
- `Include Last X Messages` counts the target message, so `1` means "just this one".
- Generating a tracker for an *older* message no longer leaks the future into the prompt: present-time injections (Summarize, vectors, author's note) are stripped for non-latest targets.
- World info is activated over the tracker's own window as a **dry run**, so generating a tracker no longer advances sticky/cooldown timers in the main chat.

**Behaviour**

- New `Allow Hidden Messages` setting — off by default; when on, hidden messages can be tracked and are used as context.
- Auto mode skips aborted generations (stopped streaming, deleted messages) instead of tracking a half-finished reply, and logs why it fired or skipped.
- An inline "Generating tracker…" bar appears on the message while it runs — the upstream spinner lives in a hidden menu, so auto-generation looked like nothing was happening.
- Trackers re-render when "Show more messages" loads older messages.
- After generation, any name in `charactersPresent` with no matching entry in `characters` is reported so you can regenerate.

**Default schema and prompt**

- Snapshot rule: the tracker describes the **end** of the message — the last thing narrated as actually happening — not a vivid moment from the middle, and not events the message only anticipates or remembers.
- Roster rule: every named person physically present gets a full entry; `{{user}}` is included only when he is actually in the scene.
- Explicit source priority (latest message → previous tracker → the whole character card → assumption) and a ban on placeholder values like "Not specified".
- Characters are dressed from the *whole* card (dressing style, appearance, prose), not just a field named "outfit". `outfit` holds only what's currently worn; removed/held clothing goes to `stateOfDress`; nothing worn is `"Nude"`.
- UK formatting: `HH:MM:SS; DD/MM/YYYY (Day Name)` and temperatures in Celsius.
- In `JSON`/`XML` modes the descriptive scene rules are sent alongside the format wrapper (previously only `Native API` mode got them).

**Imagine preset**

An extra `Imagine` schema preset for [ST-ComfyUI-Imagine](https://github.com/mozophe/ST-ComfyUI-Imagine). Imagine reads the tracker verbatim and is stateless per image, so anything it has to invent re-rolls on every generation. This preset pins the details that keep a character looking like herself: `age`, permanent `appearance`, `accessories`, `bodyState`, `expression`, and a `setting` field that carries the background forward word-for-word until the characters change room.

## Installation

Install via the SillyTavern extension installer:

```txt
https://github.com/mozophe/SillyTavern-WTracker
```

## FAQ

>I'm having API error.

Your API/model might not support structured output. Change `Prompt Engineering` mode from `Native API` to `JSON` or `XML`.

> What is the difference compared to [famous tracker](https://github.com/kaldigo/SillyTavern-Tracker)?

Most importantly, it works. This is a minimalistic version of the original tracker.
- No annoying connection profile switch. (This is the reason why I created this extension in the first place.)
- No "Prompt Maker" option. Because JSON schema is easy enough to edit.
- No "Generation Target" option. (Could be added in the future)
- No "Generation Mode" option. Since this extension doesn't summarize the chat, no need for it. (I'm not planning to add a summarize feature.)
- There are some templates in the original, but I don't need them since I don't have those features.
