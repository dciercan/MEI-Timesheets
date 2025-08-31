

import AdminDashboard from "@/components/AdminDashboard";
import { getCrewDockets, getCurrentUser } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AllSubmissionsReportPage() {
    const currentUser = await getCurrentUser();
    const dockets = await getCrewDockets(currentUser);
    
     if (dockets.length === 0) {
        return (
             <div className="container mx-auto max-w-screen-2xl py-8 px-4 md:px-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">All Crew Dockets</CardTitle>
                        <CardDescription>A log of all crew dockets from all companies.</CardDescription>
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
            <AdminDashboard 
                dockets={dockets} 
                title="All Crew Dockets" 
                description="A log of all crew dockets from all companies."
            />
        </div>
    );
}
