
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListTodo } from "lucide-react";
import type { TimesheetSubmissionWithDetails } from "@/lib/types";
import SubmissionsTable from "./SubmissionsTable";

interface AdminDashboardProps {
  submissions: TimesheetSubmissionWithDetails[];
}

export default function AdminDashboard({ submissions }: AdminDashboardProps) {

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <ListTodo className="h-16 w-16 text-muted-foreground" />
        <h2 className="mt-4 text-2xl font-semibold font-headline">No Timesheets Submitted Yet</h2>
        <p className="mt-2 text-muted-foreground">Check back later to see submissions from crew supervisors.</p>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">All Timesheet Submissions</CardTitle>
          <CardDescription>Review all entries submitted by crew supervisors.</CardDescription>
        </CardHeader>
        <CardContent>
            <SubmissionsTable submissions={submissions} />
        </CardContent>
      </Card>
  );
}
