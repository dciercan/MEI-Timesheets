
'use client';

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, ChevronRight, Building, Users, FileSignature, Book } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function ReportsPage() {
  const { user } = useAuth();

  const isSparkAdmin = user?.appRole === 'Admin';
  const isSparkUser = user?.appRole === 'Admin' || user?.appRole === 'MEI Supervisor' || user?.appRole === 'Read Only';
  const isSubbieAdmin = user?.appRole === 'Subcontractor Admin';
  const isSubbieSupervisor = user?.appRole === 'Crew Supervisor';

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold font-headline">Reports</h1>
          <p className="text-muted-foreground">
            Select a report to view.
          </p>
        </header>
        
        {isSparkUser && (
        <>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <Link href="/reports/all-submissions" className="block">
                    <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <BarChart className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="font-headline text-xl">All Crew Dockets</CardTitle>
                            <CardDescription>A complete log of all individual timesheet dockets from all supervisors.</CardDescription>
                        </div>
                        </div>
                        <ChevronRight className="h-6 w-6 text-muted-foreground" />
                    </div>
                    </CardHeader>
                </Link>
            </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <Link href="/reports/crew-activity" className="block">
                <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="font-headline text-xl">Global Crew Activity Report</CardTitle>
                        <CardDescription>A summary of all crew dockets, showing key productivity metrics.</CardDescription>
                    </div>
                    </div>
                    <ChevronRight className="h-6 w-6 text-muted-foreground" />
                </div>
                </CardHeader>
            </Link>
          </Card>
           <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <Link href="/reports/all-timesheets" className="block">
                <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <Book className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="font-headline text-xl">Global Timesheets Report</CardTitle>
                        <CardDescription>A detailed log of all individual timesheet entries from all companies.</CardDescription>
                    </div>
                    </div>
                    <ChevronRight className="h-6 w-6 text-muted-foreground" />
                </div>
                </CardHeader>
            </Link>
          </Card>
        </>
        )}

        {(isSubbieAdmin || isSubbieSupervisor) && user && (
            <>
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <Link href="/reports/my-company-submissions" className="block">
                    <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Building className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="font-headline text-xl">All {user.company} Crew Dockets</CardTitle>
                            <CardDescription>A log of all crew dockets from your company.</CardDescription>
                        </div>
                        </div>
                        <ChevronRight className="h-6 w-6 text-muted-foreground" />
                    </div>
                    </CardHeader>
                </Link>
              </Card>
               <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <Link href="/reports/crew-activity" className="block">
                    <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="font-headline text-xl">{user.company} Crew Activity Report</CardTitle>
                            <CardDescription>A summary of all crew dockets from your company, showing key productivity metrics.</CardDescription>
                        </div>
                        </div>
                        <ChevronRight className="h-6 w-6 text-muted-foreground" />
                    </div>
                    </CardHeader>
                </Link>
              </Card>
              <Card className="shadow-lg hover-shadow-xl transition-shadow">
                <Link href="/reports/my-company-timesheets" className="block">
                    <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <FileSignature className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="font-headline text-xl">All {user.company} Timesheets</CardTitle>
                            <CardDescription>A detailed log of all individual timesheet entries from your company.</CardDescription>
                        </div>
                        </div>
                        <ChevronRight className="h-6 w-6 text-muted-foreground" />
                    </div>
                    </CardHeader>
                </Link>
              </Card>
            </>
        )}
        
      </div>
    </div>
  );
}
