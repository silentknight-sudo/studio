# **App Name**: ArogyaEMS

## Core Features:

- Secure Authentication: Firebase Authentication with role-based access control (Admin, Manager, Employee) and secure routing.
- Employee Management: Create, edit, and deactivate employee profiles with details like full name, email, role, department, team, date of joining, and monthly base salary, along with an auto-generated Employee ID. Includes profile photo upload.
- Team and Department Management: Create and manage departments and teams. Assign managers and employees to teams with restricted manager access to assigned teams.
- Employee Tracker: Track daily check-in/check-out and active/inactive work status with timestamp-based logs. Admin has visibility over all employees, managers over their team, and employees over themselves.
- Payroll Management: Process monthly payroll with fixed base salary calculation and advance salary deduction. Maintain a full payroll history per employee.
- Advance Salary Management: Issue advance salaries with options for single-month or multi-month installments, automatically adjusting payroll and tracking total advance given, remaining balance, and deduction history.
- Salary Slip Generation: Automatically generate branded, professional PDF salary slips each pay period. These documents include the company logo, employee details, salary period, gross salary, advance deduction, and net payable salary. Use AI tool to reason whether or not an explanation of any adjustments is warranted.

## Style Guidelines:

- Primary color: Deep teal (#008080) to represent stability and professionalism.
- Background color: Light gray (#F0F0F0), offering a clean, neutral backdrop that reduces visual fatigue and enhances readability.
- Accent color: Muted gold (#B8860B) to add a touch of sophistication and highlight important elements.
- Headline font: 'Playfair', serif, for an elegant, fashionable, high-end feel; body font: 'PT Sans', sans-serif.
- Use clear and professional icons from a consistent set (e.g., Material Design Icons).
- Implement a clean, enterprise-grade layout with a sidebar navigation for primary sections and clear, structured content areas.
- Use subtle transitions and animations for a polished user experience (e.g., loading spinners, confirmation messages).