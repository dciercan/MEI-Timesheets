
import SupervisorDashboard from "@/components/SupervisorDashboard";
import { getSupervisorSubmissions } from "@/lib/actions";
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic';

export default async function SupervisorSubmissionsPage() {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('currentUser');
    const user = userCookie ? JSON.parse(userCookie.value) : null;
    
    if (!user) {
        // This should be handled by AuthWrapper, but as a fallback
        return <div className="text-center p-8">Please log in to view your submissions.</div>
    }
    
    const submissions = await getSupervisorSubmissions(user.id);

    return (
        <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
            <SupervisorDashboard submissions={submissions} />
        </div>
    );
}
