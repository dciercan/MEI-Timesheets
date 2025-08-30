
import { getCurrentUser, getUsers } from "@/lib/actions";
import type { User } from '@/lib/types';
import SubcontractorUserAdmin from "@/components/SubcontractorUserAdmin";
import SparkUserAdmin from "@/components/SparkUserAdmin";

export const dynamic = 'force-dynamic';

export default async function UserAdminPage() {
    // Middleware handles auth checks, so we can assume we have a user here.
    // The '!' tells TypeScript we are certain currentUser will not be null.
    const currentUser = (await getCurrentUser())!;
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
