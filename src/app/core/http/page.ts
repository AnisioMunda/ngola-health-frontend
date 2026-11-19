import { Pipe, PipeTransform } from '@angular/core';

/** Página de resultados devolvida pelo backend (PageResponse). */
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  /** O backend parou de contar no limite (1 000): há pelo menos totalElements resultados. */
  totalCapped?: boolean;
}

/** Total de uma página: "37" ou, quando o backend truncou a contagem, "mais de 1 000". */
@Pipe({ name: 'pageTotal' })
export class PageTotalPipe implements PipeTransform {
  transform(page: Pick<Page<unknown>, 'totalElements' | 'totalCapped'>): string {
    const n = page.totalElements.toLocaleString('pt-AO');
    return page.totalCapped ? `mais de ${n}` : n;
  }
}
