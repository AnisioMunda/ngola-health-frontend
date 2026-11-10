import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { App } from './app';
import { BackendStatus, SystemStatusService } from './core/system/system-status.service';

function render(status: BackendStatus) {
  TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideRouter([]),
      { provide: SystemStatusService, useValue: { checkBackend: () => of(status) } },
    ],
  });
  const fixture = TestBed.createComponent(App);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('App', () => {
  it('mostra a marca, a navegação e o backend disponível', () => {
    const el = render('UP');
    expect(el.querySelector('.brand')?.textContent).toContain('Ngola Health');
    expect(el.querySelector('nav a')?.textContent).toContain('Hospitais');
    expect(el.querySelector('.status.up')?.textContent).toContain('Backend disponível');
  });

  it('mostra o backend como indisponível', () => {
    const el = render('DOWN');
    expect(el.querySelector('.status.down')?.textContent).toContain('Backend indisponível');
  });
});
