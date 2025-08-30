
import AdminDashboard from "@/components/AdminDashboard";
import { getTimesheetSubmissions, getCurrentUser } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListTodo } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function MyCompanySubmissionsPage() {
    const currentUser = await getCurrentUser();
    
    // This should always be true on this page, but good practice to check
    if (!currentUser) {
        return (
             <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
                <p>You must be logged in to view this report.</p>
            </div>
        )
    }

    const submissions = await getTimesheetSubmissions(currentUser);
    
    if (submissions.length === 0) {
        return (
            <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">All {currentUser.company} Submissions</CardTitle>
                        <CardDescription>A log of all timesheet submissions from your company.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center h-[40vh] text-center">
                            <ListTodo className="h-16 w-16 text-muted-foreground" />
                            <h2 className="mt-4 text-2xl font-semibold font-headline">No Timesheets Submitted Yet</h2>
                            <p className="mt-2 text-muted-foreground">Check back later to see submissions from your company's crew supervisors.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">All {currentUser.company} Submissions</CardTitle>
                    <CardDescription>A log of all timesheet submissions from your company.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AdminDashboard submissions={submissions} />
                </CardContent>
            </Card>
        </div>
    );
}
