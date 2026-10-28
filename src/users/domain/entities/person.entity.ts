export class Person {
  id?: string; // Optional (auto-generated)
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  birthday: Date | null;
  phone?: string;
  address?: string;
  creditScore?: number;
  suggestedLimit?: number | null;
  creditScoreDetail?: Record<string, any> | null;

  constructor(
    documentType: string,
    documentNumber: string,
    firstName: string,
    lastName: string,
    birthday: Date | null,
    id?: string,
    phone?: string,
    address?: string,
    creditScore?: number,
    suggestedLimit?: number | null,
    creditScoreDetail?: Record<string, any> | null,
  ) {
    this.documentType = documentType;
    this.documentNumber = documentNumber;
    this.firstName = firstName;
    this.lastName = lastName;
    this.birthday = birthday;
    this.id = id;
    this.phone = phone;
    this.address = address;
    this.creditScore = creditScore ?? 85;
    this.suggestedLimit = suggestedLimit ?? null;
    this.creditScoreDetail = creditScoreDetail ?? Person.createInitialCreditScoreDetail();
  }

  static createInitialCreditScoreDetail(): Record<string, any> {
    return {
      calculated_at: new Date().toISOString(),
      score: 85,
      rating: 'A',
      rating_label: 'Bueno / Riesgo Bajo',
      summary: {
        total_loans_count: 0,
        liquidated_count: 0,
        active_count: 0,
        active_tenants_count: 0,
        has_arrears: false,
        total_debt_amount: 0,
        total_paid_amount: 0,
      },
      pillars: {
        reputation_history: {
          score: 25,
          max_score: 40,
          weight_percent: 40,
          liquidated_on_time_count: 0,
          early_liquidated_count: 0,
          liquidated_with_extension_count: 0,
          avg_delay_days: 0,
          is_new_customer: true,
          assessment: 'Cliente nuevo sin historial previo de préstamos liquidados.',
        },
        active_punctuality: {
          score: 45,
          max_score: 45,
          weight_percent: 45,
          active_delay_days: 0,
          unpaid_installments_count: 0,
          status: 'AL_DIA',
          assessment: 'Sin préstamos activos en curso (no registra deudas pendientes).',
        },
        debt_capacity: {
          score: 15,
          max_score: 15,
          weight_percent: 15,
          active_loans_count: 0,
          active_tenants_count: 0,
          has_cross_tenant_arrears: false,
          status: 'OPTIMO',
          assessment: 'Capacidad crediticia 100% disponible (sin endeudamiento previo).',
        },
      },
      recommendations: {
        status: 'APROBADO',
        suggested_action: 'Cliente nuevo sin historial: apto para primer crédito con monto inicial estándar.',
        risk_level: 'BAJO',
      },
    };
  }
}
