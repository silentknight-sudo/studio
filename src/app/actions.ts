'use server';

import { z } from 'zod';
import { generateSalarySlipWithExplanation } from '@/ai/flows/salary-slip-explanation';
import type { SalarySlip, Employee, Department, Team } from '@/lib/types';

const generateSlipSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  advanceDeduction: z.number().min(0, 'Deduction cannot be negative'),
});

type GenerateSlipInput = z.infer<typeof generateSlipSchema>;

export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Orchestrates the AI salary slip generation.
 * Follows a functional pattern to ensure data consistency before returning to the client.
 */
export async function generateSalarySlipAction(
  input: GenerateSlipInput,
  employee: Employee,
  department: Department | null,
  team: Team | null
): Promise<ActionResponse<SalarySlip>> {
  try {
    const validation = generateSlipSchema.safeParse(input);
    if (!validation.success) {
      return { 
        success: false, 
        error: validation.error.errors.map(e => e.message).join(', ') 
      };
    }

    if (!employee || !employee.id) {
      return { success: false, error: 'Valid employee data is required for generation.' };
    }

    const { advanceDeduction } = validation.data;
    const now = new Date();
    const salaryMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const grossSalary = employee.monthlyBaseSalary;
    const netPayableSalary = grossSalary - advanceDeduction;

    // AI Context Preparation
    const aiInput = {
      employeeDetails: {
        employeeId: employee.id,
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
      companyLogoUrl: 'https://arogyabio.com/logo.png', 
    };

    // Call Genkit Flow
    const aiResult = await generateSalarySlipWithExplanation(aiInput);

    if (!aiResult || !aiResult.salarySlipContent) {
      throw new Error('AI failed to produce a valid explanation for the slip.');
    }

    const slipData: SalarySlip = {
        id: `slip-${employee.id}-${Date.now()}`,
        ...aiInput,
        explanation: aiResult.salarySlipContent,
    };
    
    return { success: true, data: slipData };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during AI generation.';
    console.error('Production Error [generateSalarySlipAction]:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
