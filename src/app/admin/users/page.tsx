
import { getCurrentUser, getUsers } from "@/lib/actions";
import type { User } from '@/lib/types';
import { redirect } from 'next/navigation';
import SubcontractorUserAdmin from "@/components/SubcontractorUserAdmin";
import SparkUserAdmin from "@/components/SparkUserAdmin";

export const dynamic = 'force-dynamic';

export default async function UserAdminPage() {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
        // This should be handled by AuthWrapper, but as a safeguard
        redirect('/');
    }

    const users = await getUsers(currentUser);

    const isSparkAdmin = currentUser.appRole === 'Admin';

    return (
        <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
            {isSparkAdmin ? (
                <SparkUserAdmin initialUsers={users} currentUser={currentUser} />
            ) : (
                <SubcontractorUserAdmin initialUsers={users} currentUser={currentUser} />
            )}
        </div>
    );
}
