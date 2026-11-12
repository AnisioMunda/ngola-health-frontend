import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { PharmacyService } from '../data/pharmacy.service';
import { MedicationPicker } from './medication-picker';

describe('MedicationPicker', () => {
  it('filtra por "exige receita" quando pedido', () => {
    const search = vi.fn().mockReturnValue(
      of({
        content: [
          {
            id: 'a',
            name: 'Paracetamol',
            strength: '500 mg',
            dosageForm: 'TABLET',
            requiresPrescription: false,
            stockAvailable: 5,
            dispensingUnit: 'comprimido',
          },
          {
            id: 'b',
            name: 'Amoxicilina',
            strength: '500 mg',
            dosageForm: 'CAPSULE',
            requiresPrescription: true,
            stockAvailable: 9,
            dispensingUnit: 'cápsula',
          },
        ],
        page: 0,
        size: 15,
        totalElements: 2,
        totalPages: 1,
      }),
    );
    TestBed.configureTestingModule({
      imports: [MedicationPicker],
      providers: [{ provide: PharmacyService, useValue: { search } }],
    });
    const fixture = TestBed.createComponent(MedicationPicker);
    fixture.componentRef.setInput('requiresPrescription', false);
    const c = fixture.componentInstance as unknown as { term: string; search(): void };
    c.term = 'a';
    c.search();
    fixture.detectChanges();
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('.candidates li');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Paracetamol');
    expect(search).toHaveBeenCalledWith({ search: 'a', active: true, size: 15 });
  });
});
