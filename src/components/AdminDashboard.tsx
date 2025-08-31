

'use client';

import { ListTodo } from "lucide-react";
import type { CrewDocketWithDetails } from "@/lib/types";
import SubmissionsTable from "./SubmissionsTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface AdminDashboardProps {
  dockets: CrewDocketWithDetails[];
  title: string;
  description: string;
}

export default function AdminDashboard({ dockets, title, description }: AdminDashboardProps) {

  if (dockets.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <ListTodo className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold font-headline">No Crew Dockets Submitted Yet</h2>
            <p className="mt-2 text-muted-foreground">Check back later to see dockets from crew supervisors.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
     <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            <SubmissionsTable dockets={dockets} />
        </CardContent>
     </Card>
  );
}
