
import CrewActivityReport from "@/components/CrewActivityReport";
import { getCrewDockets, getCurrentUser } from "@/lib/actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function CrewActivityReportPage() {
    const currentUser = await getCurrentUser();
    const dockets = await getCrewDockets(currentUser); 
    
    const isSparkUser = currentUser?.appRole === 'Admin' || currentUser?.appRole === 'MEI Supervisor' || currentUser?.appRole === 'Read Only';
    const reportTitle = (isSparkUser || !currentUser?.company) ? "Crew Activity Report" : `${currentUser.company} Crew Activity Report`;

    return (
        <div className="container mx-auto max-w-screen-2xl py-8 px-4 md:px-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">{reportTitle}</CardTitle>
                    <CardDescription>A summary of all crew submissions, showing key productivity metrics.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CrewActivityReport dockets={dockets} />
                </CardContent>
            </Card>
        </div>
    );
}
