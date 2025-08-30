
import UserAdmin from "@/components/UserAdmin";
import { getUsers, getCurrentUser } from "@/lib/actions";

export const dynamic = 'force-dynamic';

export default async function UserAdminPage() {
    const currentUser = await getCurrentUser();
    const users = await getUsers(currentUser);

    return (
        <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
            <UserAdmin initialUsers={users} currentUser={currentUser} />
        </div>
    );
}
