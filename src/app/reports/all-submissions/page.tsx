
import AdminDashboard from "@/components/AdminDashboard";
import { getCrewDockets, getCurrentUser } from "@/lib/actions";

export const dynamic = 'force-dynamic';

export default async function AllSubmissionsReportPage() {
    const currentUser = await getCurrentUser();
    const dockets = await getCrewDockets(currentUser);
    
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
