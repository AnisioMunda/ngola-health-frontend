import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { DayAvailability } from '../data/scheduling.model';
import { SchedulingService } from '../data/scheduling.service';
import { SlotPicker } from './slot-picker';

const day: DayAvailability = {
  date: '2026-11-16',
  doctorId: 'd1',
  doctorName: 'Dr. Rui',
  freeSlots: 1,
  blocks: [],
  slots: [
    { startTime: '08:00:00', endTime: '08:30:00', capacity: 1, booked: 0, state: 'PAST' },
    { startTime: '08:30:00', endTime: '09:00:00', capacity: 2, booked: 1, state: 'FREE' },
    { startTime: '09:00:00', endTime: '09:30:00', capacity: 1, booked: 1, state: 'FULL' },
    { startTime: '09:30:00', endTime: '10:00:00', capacity: 1, booked: 0, state: 'BLOCKED' },
  ],
};

function render(doctorId: string | null, date: string | null) {
  const service = { availability: vi.fn().mockReturnValue(of(day)) };
  TestBed.configureTestingModule({
    imports: [SlotPicker],
    providers: [{ provide: SchedulingService, useValue: service }],
  });
  const fixture = TestBed.createComponent(SlotPicker);
  fixture.componentRef.setInput('doctorId', doctorId);
  fixture.componentRef.setInput('date', date);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, service };
}

describe('SlotPicker', () => {
  it('sem médico ou data não pede vagas', () => {
    const { el, service } = render(null, '2026-11-16');
    expect(service.availability).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Escolha o médico e a data');
  });

  it('só as vagas livres se podem escolher', () => {
    const { el, fixture } = render('d1', '2026-11-16');
    const buttons = [...el.querySelectorAll<HTMLButtonElement>('button.slot')];
    expect(buttons.map((b) => b.disabled)).toEqual([true, false, true, true]);
    expect(buttons[1].textContent).toContain('1/2');
    expect(buttons[3].textContent).toContain('Ausência');
    buttons[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe('08:30:00');
    expect(buttons[1].getAttribute('aria-checked')).toBe('true');
  });
});
