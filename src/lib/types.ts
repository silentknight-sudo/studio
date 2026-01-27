export type Role = 'Admin' | 'Manager' | 'Employee';

export type Employee = {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  departmentId: string;
  teamId?: string;
  dateOfJoining: string; // YYYY-MM-DD
  monthlyBaseSalary: number;
  status: 'Active' | 'Inactive';
  profilePhotoUrl?: string;
};

export type Department = {
  id?: string;
  name: string;
};

export type Team = {
  id?: string;
  name: string;
  departmentId: string;
  managerId?: string;
};

export type Attendance = {
  id?: string;
  employeeId: string;
  checkIn: Date;
  checkOut?: Date;
  status: 'Active' | 'Inactive';
};

export type Payroll = {
  id?: string;
  employeeId: string;
  month: string; // e.g., "June 2024"
  grossSalary: number;
  advanceDeduction: number;
  netPayableSalary: number;
};

export type Advance = {
    id?: string;
    employeeId: string;
    amount: number;
    issueDate: string; // YYYY-MM-DD
    repaymentType: 'Single-month' | 'Multi-month';
    installments: number;
    remainingBalance: number;
}

export type SalarySlip = {
    id: string;
    employeeDetails: {
      employeeId: string;
      fullName: string;
      email: string;
      department: string;
      team: string;
      dateOfJoining: string;
    };
    salaryMonth: string;
    grossSalary: number;
    advanceDeduction: number;
    netPayableSalary: number;
    explanation: string;
}

export interface UserProfile {
    id?: string;
    email: string;
    role: Role;
    displayName?: string;
    photoURL?: string;
}
