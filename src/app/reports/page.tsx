
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, ChevronRight } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold font-headline">Reports</h1>
          <p className="text-muted-foreground">
            Select a report to view.
          </p>
        </header>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <Link href="/reports/all-submissions" className="block">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <BarChart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="font-headline text-xl">All Submissions</CardTitle>
                    <CardDescription>A complete log of all timesheet submissions from all supervisors.</CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>
        
      </div>
    </div>
  );
}
