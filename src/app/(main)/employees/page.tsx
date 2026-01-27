import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export default function EmployeesPage() {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold font-headline">Employees</h1>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Employee
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Employee List</CardTitle>
                    <CardDescription>This is where the list of all employees will be displayed.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Employee management interface coming soon.</p>
                </CardContent>
            </Card>
        </div>
    )
}