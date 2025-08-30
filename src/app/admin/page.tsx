import AdminDashboard from "@/components/AdminDashboard";
import { getTimesheetSubmissions } from "@/lib/actions";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const submissions = await getTimesheetSubmissions();
    return (
        <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
            <AdminDashboard submissions={submissions} />
        </div>
    );
}
