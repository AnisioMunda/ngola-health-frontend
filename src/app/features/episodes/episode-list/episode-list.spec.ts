import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/auth/roles';
import { EpisodeService } from '../data/episode.service';
import { EpisodeList } from './episode-list';

function render(roles: Role[]) {
  const search = vi.fn().mockReturnValue(
    of({
      content: [
        {
          id: 'e1',
          patientId: 'p1',
          patientName: 'Ana Silva',
          patientRecordNumber: '000001',
          type: 'EMERGENCY',
          status: 'IN_PROGRESS',
          scheduledAt: '2026-11-10T09:00:00Z',
          reason: 'Dor torácica',
          doctorId: 'd1',
          doctorName: 'Dr. Rui',
        },
      ],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    }),
  );
  TestBed.configureTestingModule({
    imports: [EpisodeList],
    providers: [
      provideRouter([]),
      { provide: EpisodeService, useValue: { search } },
      {
        provide: AuthService,
        useValue: {
          hasAnyRole: (r: Role[]) => roles.some((x) => r.includes(x)),
          user: () => ({ id: 'd1' }),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(EpisodeList);
  fixture.detectChanges();
  return { el: fixture.nativeElement as HTMLElement, search };
}

describe('EpisodeList', () => {
  it('o médico vê por omissão os seus episódios abertos, por ordem de hora', () => {
    const { el, search } = render(['DOCTOR']);
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ['SCHEDULED', 'IN_PROGRESS'],
        doctorId: 'd1',
        order: 'asc',
      }),
    );
    expect(el.querySelector('tbody tr')?.textContent).toContain('Urgência');
    expect(el.querySelector('tbody tr')?.textContent).toContain('Em curso');
  });

  it('a recepção vê todos os médicos e pode abrir episódios', () => {
    const { el, search } = render(['RECEPTIONIST']);
    expect(search).toHaveBeenCalledWith(expect.objectContaining({ doctorId: undefined }));
    expect(el.querySelector('a.btn-primary')?.textContent).toContain('Novo episódio');
  });
});
