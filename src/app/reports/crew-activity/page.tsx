
import CrewActivityReport from "@/components/CrewActivityReport";
import { getCrewDockets, getCurrentUser } from "@/lib/actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ListTodo } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function CrewActivityReportPage() {
    const currentUser = await getCurrentUser();
    // Pass the current user to getCrewDockets to correctly filter data based on role
    const dockets = await getCrewDockets(currentUser); 
    
    // Determine the report title and description based on the user's role
    const isSparkUser = currentUser?.appRole === 'Admin' || currentUser?.appRole === 'MEI Supervisor' || currentUser?.appRole === 'Read Only';
    const reportTitle = isSparkUser ? "Global Crew Activity Report" : (currentUser?.company ? `${currentUser.company} Crew Activity Report` : "Crew Activity Report");
    const reportDescription = isSparkUser ? "A summary of all crew dockets from all companies, showing key productivity metrics." : "A summary of all crew dockets from your company, showing key productivity metrics.";

    if (dockets.length === 0) {
        return (
             <div className="container mx-auto max-w-screen-2xl py-8 px-4 md:px-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">{reportTitle}</CardTitle>
                        <CardDescription>{reportDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center h-[40vh] text-center">
                            <ListTodo className="h-16 w-16 text-muted-foreground" />
                            <h2 className="mt-4 text-2xl font-semibold font-headline">No Dockets Submitted Yet</h2>
                            <p className="mt-2 text-muted-foreground">Check back later to see dockets.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-screen-2xl py-8 px-4 md:px-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">{reportTitle}</CardTitle>
                    <CardDescription>{reportDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                    <CrewActivityReport dockets={dockets} />
                </CardContent>
            </Card>
        </div>
    );
}
