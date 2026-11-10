import { describe, expect, it } from 'vitest';

import { generateTemporaryPassword, isStrongPassword } from './password-policy';

describe('política de senha', () => {
  it('segue as mesmas regras do backend', () => {
    expect(isStrongPassword('Hospital2026')).toBe(true);
    expect(isStrongPassword('Curta1A')).toBe(false);
    expect(isStrongPassword('semmaiusculas1')).toBe(false);
    expect(isStrongPassword('SemNumerosAqui')).toBe(false);
    expect(isStrongPassword(' Espaco-Inicial1')).toBe(false);
  });

  it('gera senhas temporárias válidas e diferentes', () => {
    const generated = Array.from({ length: 50 }, () => generateTemporaryPassword());
    expect(generated.every(isStrongPassword)).toBe(true);
    expect(new Set(generated).size).toBe(50);
  });
});
