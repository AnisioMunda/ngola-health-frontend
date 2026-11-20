import { registerLocaleData } from '@angular/common';
import localePtAo from '@angular/common/locales/pt-AO';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { Dashboard as DashboardData } from '../data/reports.model';
import { ReportsService } from '../data/reports.service';
import { Dashboard } from './dashboard';

registerLocaleData(localePtAo);

const data: DashboardData = {
  from: '2026-10-20',
  to: '2026-11-18',
  patients: { active: 120, newInPeriod: 14 },
  episodes: {
    total: 58,
    completed: 50,
    byType: { OUTPATIENT: 40, EMERGENCY: 18 },
    byStatus: { COMPLETED: 50 },
  },
  triage: {
    total: 18,
    byPriority: { RED: 1, YELLOW: 17 },
    avgWaitMinutes: 12.5,
    withinTargetPercent: 88.9,
    avgWaitByPriority: { RED: 0.5, YELLOW: 13 },
  },
  appointments: { total: 30, checkedIn: 25, noShow: 3, cancelled: 2, noShowPercent: 10.7 },
  inpatient: {
    activeBeds: 20,
    occupiedBeds: 15,
    occupancyPercent: 75,
    admissions: 9,
    discharges: 8,
    deaths: 0,
    avgLengthOfStayDays: 4.2,
  },
  lab: {
    requests: 40,
    completed: 38,
    avgTurnaroundHours: 5.5,
    urgentAvgTurnaroundHours: 1.2,
    abnormalPercent: 22,
  },
  pharmacy: { lowStock: 3, expiringIn30Days: 2, expiredWithBalance: 0 },
  daily: [{ date: '2026-11-18', episodes: 2, admissions: 1, triage: 1 }],
};

describe('Dashboard', () => {
  it('mostra os indicadores e pede o período por omissão (30 dias)', () => {
    const service = { dashboard: vi.fn().mockReturnValue(of(data)) };
    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'pt-AO' },
        { provide: ReportsService, useValue: service },
      ],
    });
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const period = service.dashboard.mock.calls[0][0];
    const days = (new Date(period.to).getTime() - new Date(period.from).getTime()) / 86_400_000 + 1;
    expect(days).toBe(30);
    const cards = [...el.querySelectorAll('app-stat-card')].map((t) =>
      t.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(cards.length).toBe(8);
    const card = (label: string) => cards.find((t) => t?.includes(label)) ?? '';
    expect(card('Triagem no tempo-alvo')).toContain('88,9%');
    expect(card('Triagem no tempo-alvo')).toContain('espera média 12,5 min');
    expect(card('Ocupação de camas hoje')).toContain('75%');
    expect(card('Internamentos e altas')).toContain('/ 8 altas');
    expect(card('Tempo de resposta do laboratório')).toContain('5,5 h');
    expect(el.textContent).toContain('Amarelo (urgente)');
  });
});
