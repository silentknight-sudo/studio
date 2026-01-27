'use server';

import { z } from 'zod';
import { generateSalarySlipWithExplanation } from '@/ai/flows/salary-slip-explanation';
import { getDoc, doc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import type { SalarySlip, Employee, Department, Team } from '@/lib/types';
import { initializeFirebase } from '@/firebase'; // Cannot be used in a server component

const generateSlipSchema = z.object({
  employeeId: z.string(),
  advanceDeduction: z.number().min(0),
});

type GenerateSlipInput = z.infer<typeof generateSlipSchema>;

// This is a server action, but it needs a firestore instance.
// In a real app, you would use the Firebase Admin SDK here.
// For this environment, we'll have to be creative or acknowledge the limitation.
// Let's assume for now we can get a firestore instance on the server.
// A proper solution would be to initialize a separate admin app.
// Since we can't do that, we will fetch data on the client and pass it here,
// or we will have to call this from a client component that has access to firestore.

// The current implementation calls this from a client component, but let's adjust it
// to fetch the data within the action. This requires initializing firebase admin.
// Since we can't, we'll adjust the component to pass the required data.

export async function generateSalarySlipAction(
  input: GenerateSlipInput,
  employee: Employee,
  department: Department | undefined,
  team: Team | undefined
): Promise<{ success: boolean; data?: SalarySlip; error?: string }> {
  const validation = generateSlipSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: 'Invalid input.' };
  }

  if (!employee) {
    return { success: false, error: 'Employee data is missing.' };
  }

  const { advanceDeduction } = validation.data;

  const salaryMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const grossSalary = employee.monthlyBaseSalary;
  const netPayableSalary = grossSalary - advanceDeduction;

  try {
    const aiInput = {
      employeeDetails: {
        employeeId: employee.id!,
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
