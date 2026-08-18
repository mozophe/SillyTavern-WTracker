import { IMAGINE_SCHEMA_VALUE, IMAGINE_SCHEMA_HTML, defaultSettings } from './config.js';

const schema = IMAGINE_SCHEMA_VALUE as any;
const character = schema.properties.characters.items;

// NATIVE mode sends this schema as json_schema with strict:true, where a property that
// isn't in `required` is rejected outright by the API. Imagine also reads fields by name,
// so a field the HTML template never renders would be generated but invisible in the UI.
describe('Imagine schema', () => {
  it('marks every property required, top level and per character', () => {
    expect([...schema.required].sort()).toEqual(Object.keys(schema.properties).sort());
    expect([...character.required].sort()).toEqual(Object.keys(character.properties).sort());
  });

  it('renders every character field in its HTML template', () => {
    for (const field of Object.keys(character.properties)) {
      if (field === 'name') continue; // rendered as the heading, not a table row
      expect(IMAGINE_SCHEMA_HTML).toContain(`{{character.${field}}}`);
    }
  });

  it('renders every top-level scalar field in its HTML template', () => {
    for (const [field, def] of Object.entries<any>(schema.properties)) {
      if (def.type !== 'string') continue; // objects/arrays have their own markup
      expect(IMAGINE_SCHEMA_HTML).toContain(`{{data.${field}}}`);
    }
  });

  it('ships as a selectable preset', () => {
    expect(defaultSettings.schemaPresets.imagine).toEqual({
      name: 'Imagine',
      value: IMAGINE_SCHEMA_VALUE,
      html: IMAGINE_SCHEMA_HTML,
    });
  });
});
