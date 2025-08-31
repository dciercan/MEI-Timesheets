
import AdminDashboard from "@/components/AdminDashboard";
import { getCrewDockets, getCurrentUser } from "@/lib/actions";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const currentUser = await getCurrentUser();
    const dockets = await getCrewDockets(currentUser);
    
    return (
        <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
            <AdminDashboard dockets={dockets} />
        </div>
    );
}
