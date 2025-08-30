
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { TimesheetSubmissionWithDetails } from "@/lib/types";
import SubmissionsTable from "./SubmissionsTable";

interface SupervisorDashboardProps {
  submissions: TimesheetSubmissionWithDetails[];
}

export default function SupervisorDashboard({ submissions }: SupervisorDashboardProps) {
  
  return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">My Timesheet Submissions</CardTitle>
          <CardDescription>A record of all timesheets you have submitted.</CardDescription>
        </CardHeader>
        <CardContent>
            <SubmissionsTable submissions={submissions} view="supervisor" />
        </CardContent>
      </Card>
  );
}
