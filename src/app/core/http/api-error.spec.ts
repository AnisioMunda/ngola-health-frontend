import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { toApiError } from './api-error';

describe('toApiError', () => {
  it('extrai code, detail e erros por campo de um problem+json', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: 'Um ou mais campos são inválidos.',
        errors: { name: 'O nome é obrigatório.' },
      },
    });

    expect(toApiError(error)).toEqual({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Um ou mais campos são inválidos.',
      fieldErrors: { name: 'O nome é obrigatório.' },
    });
  });

  it('identifica falha de rede (status 0)', () => {
    const result = toApiError(new HttpErrorResponse({ status: 0 }));
    expect(result.code).toBe('NETWORK_ERROR');
  });

  it('usa mensagem genérica quando o corpo não é problem+json', () => {
    const result = toApiError(
      new HttpErrorResponse({ status: 502, error: '<html>Bad Gateway</html>' }),
    );
    expect(result).toMatchObject({ status: 502, code: 'HTTP_502' });
    expect(result.message).toContain('erro inesperado');
  });

  it('trata erros que não são HTTP', () => {
    expect(toApiError(new Error('x')).code).toBe('UNKNOWN');
  });
});
