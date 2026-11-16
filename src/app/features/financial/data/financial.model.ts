export type DocumentType = 'FT' | 'FR' | 'NC';
export type InvoiceStatus =
  'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'CREDITED';
export type PaymentMethod = 'CASH' | 'CARD' | 'MULTICAIXA_EXPRESS' | 'TRANSFER' | 'CHEQUE';
export type ServiceCategory =
  | 'CONSULTATION'
  | 'EXAM'
  | 'LAB'
  | 'IMAGING'
  | 'PROCEDURE'
  | 'SURGERY'
  | 'ACCOMMODATION'
  | 'PHARMACY'
  | 'OTHER';

export interface ServicePrice {
  id: string;
  code: string;
  description: string;
  category: ServiceCategory;
  unitPrice: number;
  vatRate: number;
  vatExemptionReason: string | null;
  active: boolean;
  version: number;
}

export interface ServicePriceRequest {
  code: string;
  description: string;
  category: ServiceCategory;
  unitPrice: number;
  vatRate: number;
  vatExemptionReason: string | null;
  version: number | null;
}

export interface LineRequest {
  servicePriceId: string | null;
  description: string | null;
  quantity: number;
  unitPrice: number | null;
  discountPercent: number | null;
  vatRate: number | null;
  vatExemptionReason: string | null;
}

export interface InvoiceRequest {
  documentType: DocumentType;
  patientId: string;
  episodeId: string | null;
  customerName: string | null;
  customerTaxId: string | null;
  customerAddress: string | null;
  dueDate: string | null;
  notes: string | null;
  lines: LineRequest[];
  version: number | null;
}

export interface InvoiceItem {
  lineNumber: number;
  servicePriceId: string | null;
  code: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  vatRate: number;
  vatExemptionReason: string | null;
  discountAmount: number;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  receivedByName: string;
  receivedAt: string;
}

export interface InvoiceSummary {
  id: string;
  documentType: DocumentType;
  number: string | null;
  status: InvoiceStatus;
  patientId: string;
  patientName: string;
  patientRecordNumber: string;
  customerName: string;
  grossTotal: number;
  paidTotal: number;
  balance: number;
  createdAt: string;
  issuedAt: string | null;
  dueDate: string | null;
  overdue: boolean;
}

export interface Invoice extends InvoiceSummary {
  episodeId: string | null;
  customerTaxId: string | null;
  customerAddress: string | null;
  issuerName: string | null;
  issuerTaxId: string | null;
  issuerAddress: string | null;
  currency: string;
  netTotal: number;
  vatTotal: number;
  notes: string | null;
  relatedInvoiceId: string | null;
  relatedInvoiceNumber: string | null;
  creditReason: string | null;
  creditNoteId: string | null;
  creditNoteNumber: string | null;
  createdByName: string;
  issuedByName: string | null;
  cancelledByName: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  items: InvoiceItem[];
  payments: Payment[];
  version: number;
}

export interface CashSummary {
  date: string;
  total: number;
  byMethod: Partial<Record<PaymentMethod, number>>;
  receipts: number;
  payments: Payment[];
}

export const TYPE_LABELS: Record<DocumentType, string> = {
  FT: 'Factura',
  FR: 'Factura-recibo',
  NC: 'Nota de crédito',
};

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Rascunho',
  ISSUED: 'Emitida',
  PARTIALLY_PAID: 'Paga em parte',
  PAID: 'Paga',
  CANCELLED: 'Anulada',
  CREDITED: 'Creditada',
};

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Numerário',
  CARD: 'Cartão (TPA)',
  MULTICAIXA_EXPRESS: 'Multicaixa Express',
  TRANSFER: 'Transferência',
  CHEQUE: 'Cheque',
};

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  CONSULTATION: 'Consultas',
  EXAM: 'Exames',
  LAB: 'Laboratório',
  IMAGING: 'Imagiologia',
  PROCEDURE: 'Procedimentos',
  SURGERY: 'Cirurgia',
  ACCOMMODATION: 'Internamento',
  PHARMACY: 'Farmácia',
  OTHER: 'Outros',
};

/** Arredondamento a 2 casas, metade para cima (como o servidor). */
export function round2(value: number): number {
  const sign = value < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(value) * 100 + 1e-7)) / 100;
}

export interface LinePreview {
  net: number;
  vat: number;
  gross: number;
}

/**
 * Pré-visualização dos valores de uma linha (o servidor recalcula e é a fonte de verdade).
 */
export function previewLine(
  quantity: number,
  unitPrice: number,
  discountPercent: number,
  vatRate: number,
): LinePreview {
  const base = round2(quantity * unitPrice);
  const discount = round2((base * discountPercent) / 100);
  const net = round2(base - discount);
  const vat = round2((net * vatRate) / 100);
  return { net, vat, gross: round2(net + vat) };
}
