'use server';

/**
 * @fileOverview AI-powered salary slip generation with adjustment explanations.
 *
 * - generateSalarySlipWithExplanation - A function to generate salary slips with AI-generated explanations for adjustments.
 * - SalarySlipInput - The input type for the generateSalarySlipWithExplanation function.
 * - SalarySlipOutput - The return type for the generateSalarySlipWithExplanation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SalarySlipInputSchema = z.object({
  employeeDetails: z.object({
    employeeId: z.string().describe('The employee ID.'),
    fullName: z.string().describe('The full name of the employee.'),
    email: z.string().email().describe('The email address of the employee.'),
    department: z.string().describe('The department the employee belongs to.'),
    team: z.string().describe('The team the employee belongs to.'),
    dateOfJoining: z.string().describe('The date the employee joined the company (YYYY-MM-DD).'),
  }).describe('Details of the employee.'),
  salaryMonth: z.string().describe('The month for which the salary slip is generated (YYYY-MM).'),
  grossSalary: z.number().describe('The gross salary for the month.'),
  advanceDeduction: z.number().describe('The amount deducted as advance salary repayment.'),
  netPayableSalary: z.number().describe('The final payable salary after deductions.'),
  companyName: z.string().describe('The name of the company.'),
  companyLogoUrl: z.string().describe('URL of the company logo.'),
});
export type SalarySlipInput = z.infer<typeof SalarySlipInputSchema>;

const SalarySlipOutputSchema = z.object({
  salarySlipContent: z.string().describe('A concise human-readable note explaining the salary components and any deductions (like advance repayment).'),
});
export type SalarySlipOutput = z.infer<typeof SalarySlipOutputSchema>;

export async function generateSalarySlipWithExplanation(input: SalarySlipInput): Promise<SalarySlipOutput> {
  return salarySlipWithExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'salarySlipWithExplanationPrompt',
  input: {schema: SalarySlipInputSchema},
  output: {schema: SalarySlipOutputSchema},
  prompt: `You are an HR Assistant for Arogya Bio. 

Generate a professional, friendly, and concise explanation for this employee's salary slip for the month of {{{salaryMonth}}}.

Employee: {{{employeeDetails.fullName}}} ({{{employeeDetails.employeeId}}})
Gross Salary: {{{grossSalary}}} INR
Advance Deduction: {{{advanceDeduction}}} INR
Net Payable: {{{netPayableSalary}}} INR

If there is an advance deduction (greater than 0), explain that it is a scheduled repayment for their salary advance. If there is no deduction, just confirm the payment of the base salary. Keep the tone professional and helpful.

Summary Note:`,
});

const salarySlipWithExplanationFlow = ai.defineFlow(
  {
    name: 'salarySlipWithExplanationFlow',
    inputSchema: SalarySlipInputSchema,
    outputSchema: SalarySlipOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
