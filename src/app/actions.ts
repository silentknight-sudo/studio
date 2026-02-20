'use server';

import { z } from 'zod';
import { generateSalarySlipWithExplanation } from '@/ai/flows/salary-slip-explanation';
import type { SalarySlip, Employee, Department, Team } from '@/lib/types';

const generateSlipSchema = z.object({
  employeeId: z.string(),
  advanceDeduction: z.number().min(0),
});

type GenerateSlipInput = z.infer<typeof generateSlipSchema>;

/**
 * Generates a salary slip with AI-powered explanations for adjustments.
 * This action receives data from the client and calls the Genkit flow.
 */
export async function generateSalarySlipAction(
  input: GenerateSlipInput,
  employee: Employee,
  department: Department | null,
  team: Team | null
): Promise<{ success: boolean; data?: SalarySlip; error?: string }> {
  const validation = generateSlipSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: 'Invalid input parameters.' };
  }

  if (!employee) {
    return { success: false, error: 'Employee data is missing.' };
  }

  const { advanceDeduction } = validation.data;

  // Use current date for the salary month
  const now = new Date();
  const salaryMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const grossSalary = employee.monthlyBaseSalary;
  const netPayableSalary = grossSalary - advanceDeduction;

  try {
    const aiInput = {
      employeeDetails: {
        employeeId: employee.id || 'N/A',
        fullName: employee.fullName,
        email: employee.email,
        department: department?.name || 'General',
        team: team?.name || 'General',
        dateOfJoining: employee.dateOfJoining,
      },
      salaryMonth,
      grossSalary,
      advanceDeduction,
      netPayableSalary,
      companyName: 'Arogya Bio',
      companyLogoUrl: 'https://arogyabio.com/logo.png', // Using a placeholder string for AI context
    };

    const result = await generateSalarySlipWithExplanation(aiInput);

    const slipData: SalarySlip = {
        id: `slip-${employee.id}-${Date.now()}`,
        ...aiInput,
        explanation: result.salarySlipContent,
    };
    
    return { success: true, data: slipData };

  } catch (error: any) {
    console.error('Error generating salary slip:', error);
    return { success: false, error: error.message || 'Failed to generate salary slip using AI.' };
  }
}
