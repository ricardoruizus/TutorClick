import type { Disputa, Pago, PaymentStatus } from '../types'
import { INITIAL_ADMIN_PAYMENTS } from '../data/mock/admin'

export interface PagosService {
  calcStudentTotal(hourlyRate: number): { rate: number; serviceFee: number; total: number }
  calcTutorNet(hourlyRate: number, featured?: boolean): {
    rate: number
    commission: number
    net: number
    pctLabel: string
  }
  authorizeProtectedCardCharge(payload: {
    amountMxn: number
    cardSummary: string
  }): Promise<{ ok: true; paymentId: string; status: PaymentStatus }>
  resolveDispute(
    disputeId: string,
    action: 'Reembolsar' | 'Liberar' | 'Reembolso parcial',
    note: string,
  ): Disputa
  listAdminPayments(): Pago[]
}

export function calcStudentTotal(rate: number) {
  const serviceFee = Math.round(rate * 10) / 100
  return { rate, serviceFee, total: rate + serviceFee }
}

export function calcTutorNet(rate: number, featured = false) {
  const pct = featured ? 0.05 : 0.15
  const commission = Math.round(rate * pct * 100) / 100
  return { rate, commission, net: rate - commission, pctLabel: featured ? '5%' : '15%' }
}

export const mockPagosService: PagosService = {
  calcStudentTotal,
  calcTutorNet,
  async authorizeProtectedCardCharge({ cardSummary }) {
    return {
      ok: true,
      paymentId: `PAG-${7000 + Math.floor(Math.random() * 900)}`,
      status: cardSummary ? 'Retenido' : 'Retenido',
    }
  },
  resolveDispute(disputeId, action, note) {
    return {
      id: disputeId,
      paymentId: 'PAG-7001',
      reservationId: 'RES-1001',
      studentName: 'Sofía Mena',
      tutorName: 'Carlos Chan',
      retainedAmountMxn: 275,
      status: action === 'Liberar' ? 'Liberado' : 'Reembolsado',
      suggestedResolution: 'Sin check-in del tutor: reembolso al alumno',
      resolutionNote: note,
    }
  },
  listAdminPayments() {
    return INITIAL_ADMIN_PAYMENTS.map((row) => {
      const numeric = Number(row.amount.replace(/[^0-9.]/g, '')) || 275
      const base = Math.round((numeric / 1.1) * 100) / 100
      const tutorCalc = calcTutorNet(base)
      return {
        id: row.payment,
        reservationId: row.reservation,
        studentName: row.people.split(' · ')[0] ?? '',
        tutorName: row.people.split(' · ')[1] ?? '',
        amountMxn: numeric,
        serviceFeeMxn: Math.round((numeric - base) * 100) / 100,
        tutorCommissionMxn: tutorCalc.commission,
        tutorNetMxn: tutorCalc.net,
        status: row.status,
        cardUsed: 'Visa •••• 4242',
        seriesNote: row.series,
      }
    })
  },
}
