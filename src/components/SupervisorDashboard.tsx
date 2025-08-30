
'use client';

import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TimesheetSubmission, User, Activity, UnproductiveReason } from "@/lib/types";
import { format } from "date-fns";
import { User as UserIcon, Calendar, Clock, Edit, ListTodo, FileText, Building, Layers, Briefcase, Hash } from "lucide-react";
import { findUserById, findActivityById, findUnproductiveReasonById } from "@/lib/actions";

interface SupervisorDashboardProps {
  submissions: TimesheetSubmission[];
}

export default function SupervisorDashboard({ submissions }: SupervisorDashboardProps) {

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">My Timesheet Submissions</CardTitle>
          <CardDescription>A record of all timesheets you have submitted.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
             {submissions.map((submission) => (
              <SubmissionAccordionItem 
                key={submission.id}
                submission={submission}
              />
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}

interface SubmissionAccordionItemProps {
  submission: TimesheetSubmission;
}

function SubmissionAccordionItem({ submission }: SubmissionAccordionItemProps) {
  const [crewMember, setCrewMember] = useState<User | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [unproductiveReasons, setUnproductiveReasons] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const user = await findUserById(submission.crewMemberId);
      const act = await findActivityById(submission.activityId);
      const reasons = await Promise.all(
          submission.unproductiveEntries.map(entry => findUnproductiveReasonById(entry.reasonId))
      );
      setCrewMember(user || null);
      setActivity(act || null);
      setUnproductiveReasons(reasons.filter(Boolean));
    }
    fetchData();
  }, [submission]);

  return (
     <AccordionItem value={submission.id}>
      <div className="flex items-center w-full">
        <AccordionTrigger className="flex-grow">
          <div className="flex justify-between w-full pr-4 items-center">
            <div className="flex items-center gap-4 text-left">
              <div className="p-2 bg-primary/10 rounded-full">
                <UserIcon className="h-5 w-5 text-primary"/>
              </div>
              <div>
                <p className="font-semibold">{crewMember?.fullName || 'Unknown User'}</p>
                <p className="text-sm text-muted-foreground">{activity?.activity || 'Unknown Activity'}</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{format(new Date(submission.timesheetDate), "PPP")}</span>
            </div>
          </div>
        </AccordionTrigger>
      </div>
      <AccordionContent className="p-4 bg-muted/20 rounded-b-md">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoItem icon={Calendar} label="Timesheet Date" value={format(new Date(submission.timesheetDate), "PPP")} />
              <InfoItem icon={UserIcon} label="Crew Member" value={crewMember?.fullName} />
              <InfoItem icon={Building} label="Asset" value={submission.asset} />
              <InfoItem icon={Layers} label="Sub Asset" value={submission.subAsset} />
              <InfoItem icon={Briefcase} label="Activity" value={activity?.activity} />
              <InfoItem icon={Clock} label="Productive Hours" value={submission.productiveHours} badge={"Hours"}/>
              <InfoItem icon={Hash} label="Quantity" value={submission.quantity} badge={activity?.activityUom} />
              <InfoItem icon={FileText} label="WBS Code" value={activity?.wbsCode} />
              <div className="md:col-span-2 lg:col-span-3">
                  <h4 className="font-semibold mb-2 flex items-center gap-2"><ListTodo className="h-4 w-4" /> Unproductive Time</h4>
                  {submission.unproductiveEntries.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-sm">
                      {submission.unproductiveEntries.map((entry, idx) => {
                      const reason = unproductiveReasons[idx];
                      return <li key={idx}>{reason?.reason || 'Unknown Reason'}: {entry.hours} mins</li>;
                      })}
                  </ul>
                  ) : (
                  <p className="text-sm text-muted-foreground">No unproductive time reported.</p>
                  )}
              </div>
              {submission.notes && (
                  <div className="md:col-span-2 lg:col-span-3">
                      <h4 className="font-semibold mb-2 flex items-center gap-2"><Edit className="h-4 w-4" /> Notes</h4>
                      <p className="text-sm text-muted-foreground bg-white p-3 rounded-md border">{submission.notes}</p>
                  </div>
              )}
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-right">Submitted on {format(new Date(submission.submittedAt), "PPP 'at' h:mm a")}</p>
      </AccordionContent>
    </AccordionItem>
  )
}

function InfoItem({ icon: Icon, label, value, badge }: { icon: React.ElementType, label: string, value?: string | number, badge?: string | null }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="flex items-start gap-3">
       <div className="p-2 bg-background rounded-full mt-1">
          <Icon className="h-4 w-4 text-muted-foreground" />
       </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2">
            <p className="font-semibold">{value}</p>
            {badge && <Badge variant="secondary">{badge}</Badge>}
        </div>
      </div>
    </div>
  )
}
