import { HttpErrorResponse } from '@angular/common/http';

/** Corpo de erro devolvido pelo backend (RFC 9457 problem+json). */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  /** Código estável definido pelo backend (ex.: VALIDATION_ERROR, PATIENT_NOT_FOUND). */
  code?: string;
  /** Erros por campo, presentes quando code = VALIDATION_ERROR. */
  errors?: Record<string, string>;
}

/** Erro normalizado, pronto a apresentar ao utilizador. */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  fieldErrors: Record<string, string>;
}

const OFFLINE_MESSAGE =
  'Não foi possível contactar o servidor. Verifique a ligação e tente novamente.';
const GENERIC_MESSAGE = 'Ocorreu um erro inesperado. Tente novamente mais tarde.';

/** Converte qualquer erro HTTP no formato {@link ApiError}, com mensagem em português. */
export function toApiError(error: unknown): ApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return { status: 0, code: 'UNKNOWN', message: GENERIC_MESSAGE, fieldErrors: {} };
  }
  if (error.status === 0) {
    return { status: 0, code: 'NETWORK_ERROR', message: OFFLINE_MESSAGE, fieldErrors: {} };
  }

  const body = isProblemDetail(error.error) ? error.error : undefined;
  return {
    status: error.status,
    code: body?.code ?? `HTTP_${error.status}`,
    message: body?.detail ?? GENERIC_MESSAGE,
    fieldErrors: body?.errors ?? {},
  };
}

function isProblemDetail(value: unknown): value is ProblemDetail {
  return typeof value === 'object' && value !== null && ('detail' in value || 'code' in value);
}
