
import Welcome from "@/components/Welcome";
import { getUsers } from "@/lib/actions";

export const dynamic = 'force-dynamic';

export default async function IndexPage() {
  const users = await getUsers();
  return <Welcome users={users} />;
}
