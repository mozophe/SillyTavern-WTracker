import { AutoModeOptions } from 'sillytavern-utils-lib/types/translate';

export enum PromptEngineeringMode {
  NATIVE = 'native',
  JSON = 'json',
  XML = 'xml',
}

export type PromptSenderRole = 'user' | 'assistant';

export interface Schema {
  name: string;
  value: object;
  html: string;
}

export interface ExtensionSettings {
  version: string;
  formatVersion: string;
  profileId: string;
  maxResponseToken: number;
  autoMode: AutoModeOptions;
  schemaPreset: string;
  schemaPresets: Record<string, Schema>;
  prompt: string;
  includeLastXMessages: number; // 0 means all messages
  includeLastXWTrackerMessages: number; // 0 means none
  allowHiddenMessages: boolean; // allow generating trackers for hidden (is_system) messages
  promptEngineeringMode: PromptEngineeringMode;
  promptRole: PromptSenderRole;
  promptJson: string;
  promptXml: string;
}

export const extensionName = 'SillyTavern-WTracker';

export const DEFAULT_PROMPT = `You are a Scene Tracker Assistant, tasked with providing clear, consistent, and structured updates to a scene tracker for a roleplay. Use the latest message, previous tracker details, and context from recent messages to accurately update the tracker. Your response must ensuring that each field is filled and complete. If specific information is not provided, make reasonable assumptions based on prior descriptions, logical inferences, or default character details.

### Key Instructions:
1. **Which Moment To Capture**: The tracker is a snapshot of ONE moment: the **latest moment the message narrates as having actually happened**. When a message covers several moments in sequence (she showers, then dresses, then cooks dinner), skip past the earlier ones and describe only the final state — where every character ends up, what they are wearing then, who is in the room by then. Never freeze on a vivid moment from the middle of the message; the next scene continues from the end, so a mid-message snapshot hands the story a state it has already moved past.
   - **Only what happened**: Ignore events the message merely anticipates, plans, remembers, imagines, or fears ("she would sit there for another fifteen minutes", "Friday was six days away", "by then she would have to decide"). These are not the current state and must never move the tracker's time, location, or character state forward.
   - **Follow the movement**: If characters change rooms, leave, or arrive during the message, the tracker reflects where they are at the end — update \`location\`, and add or remove entries in \`charactersPresent\` and \`characters\` accordingly. Someone who arrives in the final lines gets a complete new entry, built from their description or from reasonable assumptions.
2. **Roster Completeness**: Create a \`characters\` entry for EVERY named person physically present in the scene — anyone who speaks, acts, gestures, or is stated to be there. This includes companions, escorts, family, servants, background figures, and all group members. Carry forward everyone from the previous tracker unless they explicitly left. When in doubt about a character who was already in the scene, INCLUDE them. Never merge or omit a present character. Every name you place in \`charactersPresent\` MUST also have a full object in \`characters\`.
   - **{{user}} is not automatic**: Include {{user}} ONLY when he is physically in the scene — present in the room/space where the action happens. Omit him entirely when the scene follows other characters elsewhere, when he has left, or when he is merely being talked about, remembered, or phoned. Receiving a {{user}} persona description does not mean he is present. Downstream consumers treat this roster as authoritative for who is physically there.
   - **Ordering**: List the main character ({{char}}) first, {{user}} last (when present), and every other present character in between. Apply this same order to both \`charactersPresent\` and \`characters\`.
3. **Sources of Truth (in priority order)**: For every field, draw the detail from the highest-priority source that provides it:
   1. The latest message and recent scene text — this is what just changed and always wins.
   2. The previous tracker entry — the established current state. Carry it forward for continuity (e.g. a removed jacket stays removed, disheveled hair stays disheveled) unless the scene text changes it.
   3. The character's own card — description, personality, scenario, and any example dialogue provided in context — canonical baseline for appearance, wardrobe, and default attire. Read the WHOLE card, not just a field labelled "outfit": authors put clothing under headings like "Dressing Style", "Appearance", or plain personality prose. Use it to seed details the tracker has not yet established (including brand-new characters with no previous entry).
   4. Only if a detail is absent from ALL of the above, make a reasonable assumption that fits the character and setting.
   - **No Placeholders**: EVERY field must contain a concrete, committed value. NEVER use hedging or placeholder phrases such as "Not explicitly described", "Not specified", "Unknown", "N/A", "assumed present", or "(not specified)". Resolve missing details using the priority order above, then commit to the value as if it were fact.
   - **Character Details**: State hair, makeup, posture, and attire concretely — e.g. "Short black hair, neatly combed", not "Not described". Prefer details from the character's description/personality; assume defaults only when none are given anywhere.
   - **Outfit**: Describe only the garments the character is **currently wearing**, using specific details for color, fabric, and style (e.g., “fitted black leather jacket with silver studs on the collar”). Dress the character from her card per the Wardrobe rule below whenever the scene does not specify what she has on; inventing an outfit from nothing is the last resort, not the default. **Underwear currently worn must always be included and named as a concrete garment** (e.g., "white cotton briefs", "black lace bra") — never write "underwear (assumed present)" or similar. If underwear is intentionally missing, specify this clearly (e.g., "No bra", "No panties"). Do NOT list removed or discarded clothing here — record those in StateOfDress. If the character is wearing nothing, set this to "Nude".
   - **Wardrobe (how to dress a character from her card)**: Cards describe clothing in whatever shape their author chose — an explicit garment list, several named sets for different occasions, a prose passage about how she dresses, or offhand mentions scattered through the description and personality. Search all of it before dressing anyone, and treat whatever you find as binding rather than decorative:
     - **Named sets**: When the card offers several outfits (e.g. main, formal, sleeping, exercise, swimwear), pick the ONE that matches what the character is actually doing right now and name its garments as the card names them, colours included. Never blend two sets together, and never default to the first one listed when another fits the activity better.
     - **Style given, garments not**: When the card describes a taste, silhouette, or dressing style instead of specific garments, invent garments that obey it. Anything the card states as a non-negotiable — a skirt length, a heel height, a fabric she refuses, a colour she never wears — is a hard constraint on every outfit you ever build for her, not a suggestion.
     - **Always-worn items**: Anything the card says she never removes survives a change into a different outfit and stays recorded even when she is otherwise Nude. Only explicit scene text takes it off.
     - **Once dressed, stay dressed**: An outfit derived this way becomes established state. Carry it forward under priority 2 above; never re-roll a different outfit on a later update just because the latest message said nothing about clothing.
   - **StateOfDress**: Describe how put-together or disheveled the character appears, including any removed clothing. If the character is Nude, indicate where the removed clothing is placed.
4. **Incremental Time Progression**:
   - Adjust time in small increments, ideally only a few seconds per update, to reflect realistic scene progression. Avoid large jumps unless a significant time skip (e.g., sleep, travel) is explicitly stated.
   - When the message itself narrates a skip (a shower, a meal, an evening passing), advance the clock to match the end of what actually happened — the snapshot rule above wins over small increments.
   - Format the time as "HH:MM:SS; DD/MM/YYYY (Day Name)" — 24-hour clock, day before month.
5. **Context-Appropriate Times**:
   - Ensure that the time aligns with the setting. For example, if the scene takes place in a public venue (e.g., a mall), choose an appropriate time within standard operating hours.
6. **Location Format**: Avoid unintended reuse of specific locations from previous examples or responses. Provide specific, relevant, and detailed locations based on the context, using the format:
   - **Example**: “Food court, second floor near east wing entrance, Madison Square Mall, Los Angeles, CA”
   - **Room-level precision**: The most specific part of the location is the room or space the characters are actually in RIGHT NOW. Moving to another room in the same building is a location change — update it. Never leave the location on the room they started in because the building is the same.
7. **Topics Format**: Ensure topics are one- or two-word keywords relevant to the scene to help trigger contextual information. Avoid long phrases.
8. **Avoid Redundancies**: Use only details provided or logically inferred from context. Do not introduce speculative or unnecessary information.
9. **Focus and Pause**: Treat each scene update as a standalone, complete entry. Respond with the full tracker every time, even if there are only minor updates.

### Important Reminders:
1. **Recent Messages and Current Tracker**: Before updating, always consider the recent messages to ensure all changes are accurately represented.

Your primary objective is to ensure clarity, consistency, providing complete details even when specifics are not explicitly stated.

FINAL CHECK before responding: first confirm you described the END of the message — the last thing narrated as actually happening, not a striking moment from the middle and not anything the message only anticipates or remembers. If the characters moved, changed clothes, or were joined by someone before those closing lines, your tracker must show that, not the state they were in earlier. Then re-read the scene and count every distinct named person present at that moment. Your \`characters\` array must contain one object per person, with no one skipped — list everyone named as present, not only the main speakers.`;

export const DEFAULT_PROMPT_JSON = `You are a highly specialized AI assistant. Your SOLE purpose is to generate a single, valid JSON object that strictly adheres to the provided JSON schema.

**CRITICAL INSTRUCTIONS:**
1.  You MUST wrap the entire JSON object in a markdown code block (\`\`\`json\\n...\\n\`\`\`).
2.  Your response MUST NOT contain any explanatory text, comments, or any other content outside of this single code block.
3.  The JSON object inside the code block MUST be valid and conform to the schema.

**JSON SCHEMA TO FOLLOW:**
\`\`\`json
{{schema}}
\`\`\`

**EXAMPLE OF A PERFECT RESPONSE:**
\`\`\`json
{{example_response}}
\`\`\`
`;

export const DEFAULT_PROMPT_XML = `You are a highly specialized AI assistant. Your SOLE purpose is to generate a single, valid XML structure that strictly adheres to the provided example.

**CRITICAL INSTRUCTIONS:**
1.  You MUST wrap the entire XML object in a markdown code block (\`\`\`xml\\n...\\n\`\`\`).
2.  Your response MUST NOT contain any explanatory text, comments, or any other content outside of this single code block.
3.  The XML object inside the code block MUST be valid.

**JSON SCHEMA TO FOLLOW:**
\`\`\`json
{{schema}}
\`\`\`

**EXAMPLE OF A PERFECT RESPONSE:**
\`\`\`xml
<root>
{{example_response}}
</root>
\`\`\`
`;

export const DEFAULT_SCHEMA_VALUE: object = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'SceneTracker',
  description: 'Schema for tracking roleplay scene details',
  type: 'object',
  additionalProperties: false,
  properties: {
    time: {
      type: 'string',
      description: 'Format: HH:MM:SS; DD/MM/YYYY (Day Name). 24-hour clock, day before month.',
    },
    location: {
      type: 'string',
      description: 'Specific scene location with increasing specificity',
    },
    weather: {
      type: 'string',
      description: 'Current weather conditions and temperature in degrees Celsius (e.g. "Overcast and damp, 12°C")',
    },
    topics: {
      type: 'object',
      additionalProperties: false,
      properties: {
        primaryTopic: {
          type: 'string',
          description: '1-2 word main topic of interaction',
        },
        emotionalTone: {
          type: 'string',
          description: 'Dominant emotional tone of scene',
        },
        interactionTheme: {
          type: 'string',
          description: 'Type of character interaction',
        },
      },
      required: ['primaryTopic', 'emotionalTone', 'interactionTheme'],
    },
    charactersPresent: {
      type: 'array',
      items: {
        type: 'string',
        description: 'Character name',
      },
      description: 'List of character names present in scene',
    },
    characters: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: {
            type: 'string',
            description: 'Character name',
          },
          hair: {
            type: 'string',
            description: 'Hairstyle and condition',
          },
          makeup: {
            type: 'string',
            description: "Makeup description or 'None'",
          },
          outfit: {
            type: 'string',
            description: 'Only garments physically worn on the body right now (including underwear). Exclude anything removed, discarded, held, or carried - those go in stateOfDress. If nothing is worn, use "Nude".',
          },
          stateOfDress: {
            type: 'string',
            description: 'How put-together/disheveled the character appears, plus the location/state of any clothing not currently worn (removed, discarded, held, or carried).',
          },
          postureAndInteraction: {
            type: 'string',
            description: "Character's physical positioning and interaction",
          },
        },
        required: ['name', 'hair', 'makeup', 'outfit', 'stateOfDress', 'postureAndInteraction'],
      },
      description: 'Array of character objects',
    },
  },
  required: ['time', 'location', 'weather', 'topics', 'charactersPresent', 'characters'],
};

export const DEFAULT_SCHEMA_HTML = `<div class="wtracker_default_mes_template">
    <!-- Main Scene Information -->
    <table>
        <tbody>
            <tr>
                <td>Time:</td>
                <td>{{data.time}}</td>
            </tr>
            <tr>
                <td>Location:</td>
                <td>{{data.location}}</td>
            </tr>
            <tr>
                <td>Weather:</td>
                <td>{{data.weather}}</td>
            </tr>
        </tbody>
    </table>

    <!-- Collapsible Detailed Tracker -->
    <details>
        <summary><span>Tracker Details</span></summary>
        <table>
            <tbody>
                <tr>
                    <td>Topics:</td>
                    <td>
                        <!-- Accessing nested object properties -->
                        {{data.topics.primaryTopic}}; {{data.topics.emotionalTone}}; {{data.topics.interactionTheme}}
                    </td>
                </tr>
                <tr>
                    <td>Present:</td>
                    <td>
                        <!-- Joining an array of strings. Assumes a 'join' helper. -->
                        {{join data.charactersPresent ', '}}
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Character Details Section -->
        <div class="mes_wtracker_characters">
            <!-- Looping through the array of character objects -->
            {{#each data.characters as |character|}}
            <hr>
            <strong>{{character.name}}:</strong><br>
            <table>
                <tbody>
                    <tr>
                        <td>Hair:</td>
                        <td>{{character.hair}}</td>
                    </tr>
                    <tr>
                        <td>Makeup:</td>
                        <td>{{character.makeup}}</td>
                    </tr>
                    <tr>
                        <td>Outfit:</td>
                        <td>{{character.outfit}}</td>
                    </tr>
                    <tr>
                        <td>State:</td>
                        <td>{{character.stateOfDress}}</td>
                    </tr>
                    <tr>
                        <td>Position:</td>
                        <td>{{character.postureAndInteraction}}</td>
                    </tr>
                </tbody>
            </table>
            {{/each}}
        </div>
    </details>
</div>
<hr>`;

// Companion schema for ST-ComfyUI-Imagine. Imagine reads `message.extra.WTracker.value`
// verbatim as [TRACKER STATE] and is under standing orders to OMIT anything the tracker
// does not state (ethnicity/skin tone for characters whose name doesn't match the loaded
// card, age, etc). Imagine is stateless per image, so any detail it invents re-rolls on
// every generation. This schema pins those details here, where they persist and carry
// forward, which is what keeps a character looking like herself across a whole chat.
export const IMAGINE_SCHEMA_VALUE: object = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'SceneTracker',
  description: 'Scene tracker tuned to drive image generation: every field must be concrete and visually usable',
  type: 'object',
  additionalProperties: false,
  properties: {
    time: {
      type: 'string',
      description: 'Format: HH:MM:SS; DD/MM/YYYY (Day Name). 24-hour clock, day before month.',
    },
    location: {
      type: 'string',
      description:
        'Where the characters are RIGHT NOW, most specific part first: the exact room or space, then the building, then the city. Moving to another room in the same building is a location change and must be reflected here - never leave this on the room the scene started in.',
    },
    setting: {
      type: 'string',
      description:
        'Visible surroundings of the room named in `location`, and only that room: its walls, floor, furniture and surfaces, notable props and objects in view, and the background. Describe the space the characters are actually standing in, not an adjoining one. While they stay in that room, carry this forward word for word so backgrounds stay identical between images; rewrite it from scratch the moment they move to a different room or space, including another room in the same building.',
    },
    weather: {
      type: 'string',
      description: 'Current weather conditions and temperature in degrees Celsius (e.g. "Overcast and damp, 12°C")',
    },
    topics: {
      type: 'object',
      additionalProperties: false,
      properties: {
        primaryTopic: {
          type: 'string',
          description: '1-2 word main topic of interaction',
        },
        emotionalTone: {
          type: 'string',
          description: 'Dominant emotional tone of scene',
        },
        interactionTheme: {
          type: 'string',
          description: 'Type of character interaction',
        },
      },
      required: ['primaryTopic', 'emotionalTone', 'interactionTheme'],
    },
    charactersPresent: {
      type: 'array',
      items: {
        type: 'string',
        description: 'Character name',
      },
      description:
        'Names of the characters PHYSICALLY PRESENT in the space where the action is happening. Include {{user}} ONLY when he is bodily in the scene - omit him when the scene follows other characters elsewhere, when he has left, or when he is only being talked about, remembered, or phoned. This roster is treated as authoritative for who is physically there, so a name listed here that is not actually present will place that person in the frame. Order: {{char}} first, {{user}} last when present, everyone else in between.',
    },
    characters: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: {
            type: 'string',
            description: 'Character name',
          },
          age: {
            type: 'string',
            description:
              'Age in years as digits (e.g. "27"). Take it from the character description when stated, otherwise infer from context cues (occupation, life stage, family role) and commit. Every character is an adult: never below 18. Once set, carry forward unchanged.',
          },
          appearance: {
            type: 'string',
            description:
              'Permanent physical identity that does not change from scene to scene: ethnicity/nationality, skin tone, body build and proportions, height, and eye color. Required for EVERY character including side characters who have no character card - if their description is silent, choose values that fit the setting and commit. Set once and carry forward verbatim; never re-roll or reword this between updates.',
          },
          hair: {
            type: 'string',
            description: 'Hair color, length, and current style and condition',
          },
          makeup: {
            type: 'string',
            description: "Makeup description or 'None'",
          },
          expression: {
            type: 'string',
            description:
              'Current facial expression and where the eyes are looking, e.g. "flushed, lips parted, eyes locked on {{user}}" or "jaw tight, gaze fixed on the door".',
          },
          outfit: {
            type: 'string',
            description:
              'Only garments physically worn on the body right now, including underwear, shoes, and socks. Name color and fabric for each. Exclude anything removed, discarded, held, or carried - those go in stateOfDress. If nothing is worn, use "Nude".',
          },
          stateOfDress: {
            type: 'string',
            description:
              'How put-together/disheveled the character appears, plus the location/state of any clothing not currently worn (removed, discarded, held, or carried).',
          },
          accessories: {
            type: 'string',
            description:
              "Worn items that are not clothing: glasses, jewelry, watch, hair ties, plus permanent marks such as tattoos, piercings, and scars with their placement. 'None' if there are none. Permanent marks carry forward unchanged, and so does anything the character card says she never takes off - those stay listed through every outfit change and while she is otherwise nude.",
          },
          bodyState: {
            type: 'string',
            description:
              "Visible condition of skin and body right now: sweat, flush, goosebumps, tears, smeared makeup, wetness, dirt, bruises, marks. 'None' if unremarkable.",
          },
          postureAndInteraction: {
            type: 'string',
            description:
              'Current posture, the surface or object supporting the body, which direction the character faces, and every point of physical contact with others. Always name the support explicitly, e.g. "kneeling upright on the bed, facing {{user}}, both hands flat on his chest" or "standing on the tiled floor, back against the wall, arms crossed". During sexual contact this field MUST name the position outright (cowgirl, reverse cowgirl, doggy style, missionary, spooning, oral, etc.) and state where the penis is - penetrating which orifice and how deep, held, stroked, or resting against a named body part - rather than describing the act only through verbs.',
          },
        },
        required: [
          'name',
          'age',
          'appearance',
          'hair',
          'makeup',
          'expression',
          'outfit',
          'stateOfDress',
          'accessories',
          'bodyState',
          'postureAndInteraction',
        ],
      },
      description: 'Array of character objects',
    },
  },
  required: ['time', 'location', 'setting', 'weather', 'topics', 'charactersPresent', 'characters'],
};

export const IMAGINE_SCHEMA_HTML = `<div class="wtracker_default_mes_template">
    <!-- Main Scene Information -->
    <table>
        <tbody>
            <tr>
                <td>Time:</td>
                <td>{{data.time}}</td>
            </tr>
            <tr>
                <td>Location:</td>
                <td>{{data.location}}</td>
            </tr>
            <tr>
                <td>Weather:</td>
                <td>{{data.weather}}</td>
            </tr>
        </tbody>
    </table>

    <!-- Collapsible Detailed Tracker -->
    <details>
        <summary><span>Tracker Details</span></summary>
        <table>
            <tbody>
                <tr>
                    <td>Setting:</td>
                    <td>{{data.setting}}</td>
                </tr>
                <tr>
                    <td>Topics:</td>
                    <td>
                        {{data.topics.primaryTopic}}; {{data.topics.emotionalTone}}; {{data.topics.interactionTheme}}
                    </td>
                </tr>
                <tr>
                    <td>Present:</td>
                    <td>
                        {{join data.charactersPresent ', '}}
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Character Details Section -->
        <div class="mes_wtracker_characters">
            {{#each data.characters as |character|}}
            <hr>
            <strong>{{character.name}}:</strong><br>
            <table>
                <tbody>
                    <tr>
                        <td>Age:</td>
                        <td>{{character.age}}</td>
                    </tr>
                    <tr>
                        <td>Appearance:</td>
                        <td>{{character.appearance}}</td>
                    </tr>
                    <tr>
                        <td>Hair:</td>
                        <td>{{character.hair}}</td>
                    </tr>
                    <tr>
                        <td>Makeup:</td>
                        <td>{{character.makeup}}</td>
                    </tr>
                    <tr>
                        <td>Expression:</td>
                        <td>{{character.expression}}</td>
                    </tr>
                    <tr>
                        <td>Outfit:</td>
                        <td>{{character.outfit}}</td>
                    </tr>
                    <tr>
                        <td>State:</td>
                        <td>{{character.stateOfDress}}</td>
                    </tr>
                    <tr>
                        <td>Accessories:</td>
                        <td>{{character.accessories}}</td>
                    </tr>
                    <tr>
                        <td>Body:</td>
                        <td>{{character.bodyState}}</td>
                    </tr>
                    <tr>
                        <td>Position:</td>
                        <td>{{character.postureAndInteraction}}</td>
                    </tr>
                </tbody>
            </table>
            {{/each}}
        </div>
    </details>
</div>
<hr>`;

const VERSION = '0.1.0';
const FORMAT_VERSION = 'F_1.0';
export const EXTENSION_KEY = 'WTracker';

export const defaultSettings: ExtensionSettings = {
  version: VERSION,
  formatVersion: FORMAT_VERSION,
  profileId: '',
  maxResponseToken: 16000,
  autoMode: AutoModeOptions.NONE,
  schemaPreset: 'default',
  schemaPresets: {
    default: {
      name: 'Default',
      value: DEFAULT_SCHEMA_VALUE,
      html: DEFAULT_SCHEMA_HTML,
    },
    imagine: {
      name: 'Imagine',
      value: IMAGINE_SCHEMA_VALUE,
      html: IMAGINE_SCHEMA_HTML,
    },
  },
  prompt: DEFAULT_PROMPT,
  includeLastXMessages: 0,
  includeLastXWTrackerMessages: 1,
  allowHiddenMessages: false,
  promptEngineeringMode: PromptEngineeringMode.NATIVE,
  promptRole: 'user',
  promptJson: DEFAULT_PROMPT_JSON,
  promptXml: DEFAULT_PROMPT_XML,
};
