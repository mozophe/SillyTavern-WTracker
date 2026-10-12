import { isOocMessage, isOocTurn } from './ooc.js';

describe('isOocMessage', () => {
  it.each([
    'OOC explain the previous reply',
    '  OOC: change the formatting',
    'ooc please stop the scene',
    '(OOC: how old is she again?)',
    '((OOC: how old is she again?))',
    '[OOC: how old is she again?]',
    '<OOC> how old is she again?',
    '**OOC** how old is she again?',
    '  ((ooc: lowercase and indented))',
  ])('matches %j', (text) => {
    expect(isOocMessage(text)).toBe(true);
  });

  it.each([
    'This mentions OOC later',
    'OOCly phrased',
    '',
    null,
    '[ she leaves the room ]',
    '(( a door slams ))',
    '*he shrugs*',
    '{{OOC}} macro syntax, not a marker',
  ])('does not match %j', (text) => {
    expect(isOocMessage(text)).toBe(false);
  });
});

describe('isOocTurn', () => {
  const chat = [
    { is_user: true, mes: 'Normal roleplay' },
    { is_user: false, mes: 'Reply' },
    { is_user: true, mes: '(OOC: adjust the style)' },
    { is_user: false, mes: 'Understood' },
    { is_user: true, mes: 'Back in character' },
    { is_user: false, mes: 'Reply' },
  ];

  it('covers the OOC user message and the reply to it', () => {
    expect(isOocTurn(chat, 2)).toBe(true);
    expect(isOocTurn(chat, 3)).toBe(true);
  });

  it('leaves the turns before and after alone', () => {
    expect(isOocTurn(chat, 1)).toBe(false);
    expect(isOocTurn(chat, 4)).toBe(false);
    expect(isOocTurn(chat, 5)).toBe(false);
  });

  it('is false when no user message precedes (greeting)', () => {
    expect(isOocTurn([{ is_user: false, mes: 'OOC greeting' }], 0)).toBe(false);
  });
});
