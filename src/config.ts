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
1. **Roster Completeness**: Create a \`characters\` entry for EVERY named person physically present in the scene — anyone who speaks, acts, gestures, or is stated to be there. This includes companions, escorts, family, servants, background figures, and all group members. Carry forward everyone from the previous tracker unless they explicitly left. When in doubt about a character who was already in the scene, INCLUDE them. Never merge or omit a present character. Every name you place in \`charactersPresent\` MUST also have a full object in \`characters\`.
   - **{{user}} is not automatic**: Include {{user}} ONLY when he is physically in the scene — present in the room/space where the action happens. Omit him entirely when the scene follows other characters elsewhere, when he has left, or when he is merely being talked about, remembered, or phoned. Receiving a {{user}} persona description does not mean he is present. Downstream consumers treat this roster as authoritative for who is physically there.
   - **Ordering**: List the main character ({{char}}) first, {{user}} last (when present), and every other present character in between. Apply this same order to both \`charactersPresent\` and \`characters\`.
2. **Sources of Truth (in priority order)**: For every field, draw the detail from the highest-priority source that provides it:
   1. The latest message and recent scene text — this is what just changed and always wins.
   2. The previous tracker entry — the established current state. Carry it forward for continuity (e.g. a removed jacket stays removed, disheveled hair stays disheveled) unless the scene text changes it.
   3. The character's own description and personality (provided in context) — canonical baseline for appearance and default attire. Use it to seed details the tracker has not yet established (including brand-new characters with no previous entry).
   4. Only if a detail is absent from ALL of the above, make a reasonable assumption that fits the character and setting.
   - **No Placeholders**: EVERY field must contain a concrete, committed value. NEVER use hedging or placeholder phrases such as "Not explicitly described", "Not specified", "Unknown", "N/A", "assumed present", or "(not specified)". Resolve missing details using the priority order above, then commit to the value as if it were fact.
   - **Character Details**: State hair, makeup, posture, and attire concretely — e.g. "Short black hair, neatly combed", not "Not described". Prefer details from the character's description/personality; assume defaults only when none are given anywhere.
   - **Outfit**: Describe only the garments the character is **currently wearing**, using specific details for color, fabric, and style (e.g., “fitted black leather jacket with silver studs on the collar”). Use the character's described default attire when the scene does not specify one; only invent a complete outfit when neither the scene nor the character description provides one. **Underwear currently worn must always be included and named as a concrete garment** (e.g., "white cotton briefs", "black lace bra") — never write "underwear (assumed present)" or similar. If underwear is intentionally missing, specify this clearly (e.g., "No bra", "No panties"). Do NOT list removed or discarded clothing here — record those in StateOfDress. If the character is wearing nothing, set this to "Nude".
   - **StateOfDress**: Describe how put-together or disheveled the character appears, including any removed clothing. If the character is Nude, indicate where the removed clothing is placed.
3. **Incremental Time Progression**:
   - Adjust time in small increments, ideally only a few seconds per update, to reflect realistic scene progression. Avoid large jumps unless a significant time skip (e.g., sleep, travel) is explicitly stated.
   - Format the time as "HH:MM:SS; MM/DD/YYYY (Day Name)".
4. **Context-Appropriate Times**:
   - Ensure that the time aligns with the setting. For example, if the scene takes place in a public venue (e.g., a mall), choose an appropriate time within standard operating hours.
5. **Location Format**: Avoid unintended reuse of specific locations from previous examples or responses. Provide specific, relevant, and detailed locations based on the context, using the format:
   - **Example**: “Food court, second floor near east wing entrance, Madison Square Mall, Los Angeles, CA”
6. **Topics Format**: Ensure topics are one- or two-word keywords relevant to the scene to help trigger contextual information. Avoid long phrases.
7. **Avoid Redundancies**: Use only details provided or logically inferred from context. Do not introduce speculative or unnecessary information.
8. **Focus and Pause**: Treat each scene update as a standalone, complete entry. Respond with the full tracker every time, even if there are only minor updates.

### Important Reminders:
1. **Recent Messages and Current Tracker**: Before updating, always consider the recent messages to ensure all changes are accurately represented.

Your primary objective is to ensure clarity, consistency, providing complete details even when specifics are not explicitly stated.

FINAL CHECK before responding: re-read the scene and count every distinct named person present. Your \`characters\` array must contain one object per person, with no one skipped — list everyone named as present, not only the main speakers.`;

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
  properties: {
    time: {
      type: 'string',
      description: 'Format: HH:MM:SS; MM/DD/YYYY (Day Name)',
    },
    location: {
      type: 'string',
      description: 'Specific scene location with increasing specificity',
    },
    weather: {
      type: 'string',
      description: 'Current weather conditions and temperature',
    },
    topics: {
      type: 'object',
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
  properties: {
    time: {
      type: 'string',
      description: 'Format: HH:MM:SS; MM/DD/YYYY (Day Name)',
    },
    location: {
      type: 'string',
      description: 'Specific scene location with increasing specificity',
    },
    setting: {
      type: 'string',
      description:
        'Visible surroundings: the room or space, its furniture and surfaces, notable props and objects in view, and the background. Carry forward unchanged while the scene stays in one place so backgrounds stay consistent between images; rewrite only when the characters move somewhere new.',
    },
    weather: {
      type: 'string',
      description: 'Current weather conditions and temperature',
    },
    topics: {
      type: 'object',
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
              "Worn items that are not clothing: glasses, jewelry, watch, hair ties, plus permanent marks such as tattoos, piercings, and scars with their placement. 'None' if there are none. Permanent marks carry forward unchanged.",
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
