import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const PASSWORD_HINT =
  'Entre 10 e 64 caracteres, com letras minúsculas, maiúsculas e números.';

/** Mesma política do backend (o backend continua a ser a referência). */
export function isStrongPassword(value: string): boolean {
  const length = [...value].length;
  return (
    length >= 10 &&
    length <= 64 &&
    new TextEncoder().encode(value).length <= 72 &&
    /\p{Ll}/u.test(value) &&
    /\p{Lu}/u.test(value) &&
    /\d/.test(value) &&
    value.trim() === value
  );
}

export const strongPassword: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value as string | null;
  return !value || isStrongPassword(value) ? null : { weakPassword: true };
};

const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';

/** Senha temporária aleatória (sem caracteres ambíguos como 0/O e 1/l), fácil de ditar. */
export function generateTemporaryPassword(length = 14): string {
  const all = LOWER + UPPER + DIGITS;
  const pick = (set: string) => set[randomInt(set.length)];
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS)];
  while (chars.length < length) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function randomInt(max: number): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] % max;
}
