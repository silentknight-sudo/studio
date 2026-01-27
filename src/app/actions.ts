'use server';

import { z } from 'zod';
import { generateSalarySlipWithExplanation } from '@/ai/flows/salary-slip-explanation';
import { employees, departments, teams } from '@/lib/mock-data';
import type { SalarySlip } from '@/lib/types';

const generateSlipSchema = z.object({
  employeeId: z.string(),
  advanceDeduction: z.number().min(0),
});

type GenerateSlipInput = z.infer<typeof generateSlipSchema>;

export async function generateSalarySlipAction(
  input: GenerateSlipInput
): Promise<{ success: boolean; data?: SalarySlip; error?: string }> {
  const validation = generateSlipSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: 'Invalid input.' };
  }

  const { employeeId, advanceDeduction } = validation.data;

  const employee = employees.find((e) => e.id === employeeId);
  if (!employee) {
    return { success: false, error: 'Employee not found.' };
  }

  const department = departments.find(d => d.id === employee.departmentId);
  const team = teams.find(t => t.id === employee.teamId);

  const salaryMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const grossSalary = employee.monthlyBaseSalary;
  const netPayableSalary = grossSalary - advanceDeduction;

  try {
    const aiInput = {
      employeeDetails: {
        employeeId: employee.id,
        fullName: employee.fullName,
        email: employee.email,
        department: department?.name || 'N/A',
        team: team?.name || 'N/A',
        dateOfJoining: employee.dateOfJoining,
      },
      salaryMonth,
      grossSalary,
      advanceDeduction,
      netPayableSalary,
      companyName: 'Arogya Bio',
      companyLogoUrl: '/logo.svg', // Placeholder, will be rendered as SVG
    };

    const result = await generateSalarySlipWithExplanation(aiInput);

    const slipData: SalarySlip = {
        id: `slip-${Date.now()}`,
        ...aiInput,
        explanation: result.salarySlipContent,
    };
    
    return { success: true, data: slipData };

  } catch (error) {
    console.error('Error generating salary slip:', error);
    return { success: false, error: 'Failed to generate salary slip using AI.' };
  }
}
