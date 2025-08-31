

'use client';

import { ListTodo } from "lucide-react";
import type { CrewDocketWithDetails } from "@/lib/types";
import SubmissionsTable from "./SubmissionsTable";

interface AdminDashboardProps {
  dockets: CrewDocketWithDetails[];
}

export default function AdminDashboard({ dockets }: AdminDashboardProps) {

  if (dockets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <ListTodo className="h-16 w-16 text-muted-foreground" />
        <h2 className="mt-4 text-2xl font-semibold font-headline">No Crew Dockets Submitted Yet</h2>
        <p className="mt-2 text-muted-foreground">Check back later to see dockets from crew supervisors.</p>
      </div>
    );
  }

  return (
    <SubmissionsTable dockets={dockets} />
  );
}
