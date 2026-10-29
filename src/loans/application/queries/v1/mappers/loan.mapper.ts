import { Loan } from '@loans/domain/entities/loan.entity';
import { DashboardStats } from '@loans/domain/repositories/loan.repository';
import { LoanAppDto, DashboardAppDto } from '../dto/loan-app.dto';

export class LoanMapper {
  static toLoanAppDto(loan: Loan): LoanAppDto {
    return {
      id: loan.id,
      startDate: loan.startDate,
      endDate: loan.endDate,
      amount: loan.amount,
      interest: loan.interest,
      interestRate: loan.interestRate,
      fee: loan.fee,
      days: loan.days,
      createdAt: loan.createdAt,
      status: loan.status,
      address: loan.address,
      phone: loan.phone,
      paidToday: loan.paidToday ?? 0,
      remainingAmount: loan.remainingAmount ?? loan.amount + loan.interest,
      inIntervalPayment: loan.inIntervalPayment ?? 0,
      liquidationDate: loan.liquidationDate,
      completedOnTime: loan.completedOnTime,
      earlyLiquidationDays: loan.earlyLiquidationDays,
      extensionDays: loan.extensionDays,
      delayDays: loan.delayDays,
      creditRating: loan.creditRating,
      idPeople: loan.idPeople.toString(),
      userId: loan.userId.toString(),
      documentNumber: loan.person?.documentNumber,
      clientName: loan.person
        ? `${loan.person.firstName} ${loan.person.lastName}`
        : undefined,
      collectorDocumentNumber: loan.user?.person?.documentNumber,
      collectorName: loan.user?.person 
        ? `${loan.user.person.firstName} ${loan.user.person.lastName}`
        : loan.user?.username,
      companyId: loan.user?.idCompany,
      isPersonSynced: loan.person?.isSynced ?? true,
      installments: loan.installments?.map((inst) => ({
        id: inst.id || '',
        date: inst.installmentDate,
        amount: inst.amount,
        status: inst.status,
        registeredBy: inst.userName || 'Unknown',
        registeredByUserId: inst.userId || '',
      })),
    };
  }

  static toDashboardAppDto(stats: DashboardStats): DashboardAppDto {
    return {
      totalLentToday: stats.totalLentToday,
      collectedToday: stats.collectedToday,
      activeClients: stats.activeClients,
      pendingLoans: stats.pendingLoans.map((loan) => this.toLoanAppDto(loan)),
      detailCollectedToday: stats.detailCollectedToday,
      totalExpensesToday: stats.totalExpensesToday,
      thermometer: stats.thermometer,
      userId: stats.userId,
      companyId: stats.companyId,
    };
  }
}
