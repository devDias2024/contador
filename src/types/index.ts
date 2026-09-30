export type RideCategory = 
  | '99pop' 
  | '99plus' 
  | '99moto' 
  | '99entrega' 
  | '99compartilhado' 
  | 'particular';

export type PaymentMethod = 
  | 'app' 
  | 'dinheiro' 
  | 'pix' 
  | 'cartao_maquininha';

export interface Ride {
  id: string;
  timestamp: number;
  timeStr: string;
  grossValue: number;
  distanceKm: number;
  category: RideCategory;
  paymentMethod: PaymentMethod;
  tip?: number;
  notes?: string;
}

export type ExpenseCategory = 
  | 'combustivel' 
  | 'alimentacao' 
  | 'lavagem' 
  | 'pedagio' 
  | 'manutencao' 
  | 'outro';

export interface Expense {
  id: string;
  timestamp: number;
  timeStr: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
}

export interface ShiftState {
  isActive: boolean;
  isPaused: boolean;
  startTime: number | null;
  lastResumeTime: number | null;
  accumulatedActiveMs: number;
  date: string;
}

export interface VehicleConfig {
  fuelPrice: number; // R$ per liter (or m³ if GNV)
  fuelEfficiencyKmPerL: number; // km per liter
  directCostPerKm: number; // R$ per km
  useDirectCost: boolean;
  includeMaintenance: boolean;
  maintenanceCostPerKm: number; // R$ per km
  vehicleType: 'carro_flex' | 'carro_gnv' | 'moto' | 'eletrico';
}

export interface OdometerState {
  initialKm: number | null;
  currentKm: number | null;
}

export interface DailyGoal {
  targetAmount: number; // e.g. 200
  targetRides?: number; // e.g. 12
}

export interface AppSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  floatingBubbleEnabled: boolean;
  theme: 'dark' | 'light';
}
