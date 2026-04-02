export interface InstallmentAppDto {
  id: string;
  date: Date;
  amount: number;
  status: string;
  registeredBy: string;
  registeredByUserId: string;
}

export class LoanAppDto {
  id?: string;
  startDate: Date;
  endDate: Date;
  amount: number;
  interest: number;
  fee: number;
  days: number;
  createdAt: Date;
  status: string;
  address: string;
  phone?: string;

  // Calculados
  paidToday: number;
  remainingAmount: number;
  inIntervalPayment: number;

  // Datos externos desnormalizados
  idPeople: string;
  userId: string;
  documentNumber?: string;
  clientName?: string;
  collectorName?: string;
  companyId?: string;

  installments?: InstallmentAppDto[];
}

export class DashboardAppDto {
  totalLentToday: number;
  collectedToday: number;
  activeClients: number;
  pendingLoans: LoanAppDto[];
  detailCollectedToday: {
    yape: number;
    efectivo: number;
  };
  totalExpensesToday: number;
  thermometer: number;
  userId?: string;
  companyId?: string;
}
