
import AdminDashboard from "@/components/AdminDashboard";
import { getTimesheetSubmissions } from "@/lib/actions";
import { cookies } from 'next/headers'
import { User } from "@/lib/types";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const cookieStore = cookies()
    const currentUserCookie = cookieStore.get('currentUser')
    const currentUser: User | undefined = currentUserCookie ? JSON.parse(currentUserCookie.value) : undefined;
    
    const submissions = await getTimesheetSubmissions(currentUser);
    return (
        <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
            <AdminDashboard submissions={submissions} />
        </div>
    );
}
