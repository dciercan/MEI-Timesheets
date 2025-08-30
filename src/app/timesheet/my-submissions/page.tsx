

import SupervisorDashboard from "@/components/SupervisorDashboard";
import { getSupervisorSubmissions } from "@/lib/actions";
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SupervisorSubmissionsPage() {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('currentUser');
    
    if (!userCookie) {
        // This should be handled by AuthWrapper, but as a fallback
        return <div className="container mx-auto text-center p-8">Please log in to view your submissions.</div>
    }

    let user;
    try {
        user = JSON.parse(userCookie.value);
    } catch (e) {
        // Invalid cookie, redirect to login
        redirect('/');
    }
    
    if (!user || !user.id) {
        return <div className="container mx-auto text-center p-8">Could not identify user. Please log in again.</div>
    }
    
    const submissions = await getSupervisorSubmissions(user.id);

    return (
        <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
            <SupervisorDashboard submissions={submissions} />
        </div>
    );
}
