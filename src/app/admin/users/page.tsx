import UserAdmin from "@/components/UserAdmin";
import { getUsers } from "@/lib/actions";

export const dynamic = 'force-dynamic';

export default async function UserAdminPage() {
    const users = await getUsers();
    return (
        <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
            <UserAdmin users={users} />
        </div>
    );
}
