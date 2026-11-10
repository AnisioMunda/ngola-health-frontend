import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { App } from './app';
import { BackendStatus, SystemStatusService } from './core/system/system-status.service';

function render(status: BackendStatus) {
  TestBed.configureTestingModule({
    imports: [App],
    providers: [{ provide: SystemStatusService, useValue: { checkBackend: () => of(status) } }],
  });
  const fixture = TestBed.createComponent(App);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('App', () => {
  it('mostra o backend como disponível', () => {
    const el = render('UP');
    expect(el.querySelector('h1')?.textContent).toContain('Ngola Health');
    expect(el.querySelector('.status')?.textContent).toContain('Backend disponível');
  });

  it('mostra o backend como indisponível', () => {
    const el = render('DOWN');
    expect(el.querySelector('.status.down')?.textContent).toContain('Backend indisponível');
  });
});
