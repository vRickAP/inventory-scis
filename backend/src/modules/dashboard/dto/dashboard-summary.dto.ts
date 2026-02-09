export class ChartDataPointDto {
  date: string;
  movementType: string;
  count: number;
}

export class RecentMovementDto {
  id: string;
  movementType: string;
  status: string;
  reference?: string;
  createdBy: string;
  creatorName: string;
  itemCount: number;
  createdAt: Date;
}

export class DashboardSummaryDto {
  totalProducts: number;
  activeProducts: number;
  totalStock: number;
  lowStockCount: number;
  recentMovements: RecentMovementDto[];
  chartData: ChartDataPointDto[];
}
