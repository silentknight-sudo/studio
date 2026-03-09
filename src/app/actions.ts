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
 * Orchestrates AI salary slip generation with enhanced hosting error diagnostics.
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

    // Standardize dates for the slip
    const now = new Date();
    const salaryMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const grossSalary = employee.monthlyBaseSalary;
    const netPayableSalary = grossSalary - validation.data.advanceDeduction;

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
      advanceDeduction: validation.data.advanceDeduction,
      netPayableSalary,
      companyName: 'Arogya Bio',
      companyLogoUrl: 'https://arogyabio.com/logo.png', 
    };

    // Call Genkit Flow
    const aiResult = await generateSalarySlipWithExplanation(aiInput);

    if (!aiResult || !aiResult.salarySlipContent) {
      throw new Error('AI Engine returned an empty response.');
    }

    const slipData: SalarySlip = {
        id: `slip-${employee.id}-${Date.now()}`,
        ...aiInput,
        explanation: aiResult.salarySlipContent,
    };
    
    return { success: true, data: slipData };

  } catch (error: any) {
    console.error('Production AI Generation Error:', error);
    
    // Explicit Hosting Configuration Feedback
    if (error.message?.includes('API key') || error.message?.includes('credential') || error.message?.includes('403')) {
        return { 
            success: false, 
            error: 'AI CONFIGURATION ERROR: The GEMINI_API_KEY is missing or invalid in your hosting environment. Please check your secrets/environment variables.' 
        };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'A system error occurred while generating the payslip.' 
    };
  }
}
