
'use client';

import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TimesheetSubmission, User, Activity, UnproductiveReason } from "@/lib/types";
import { format } from "date-fns";
import { User as UserIcon, Calendar, Clock, Edit, ListTodo, FileText, Building, Layers, Trash2, MoreVertical, Briefcase, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteTimesheet, findUserById, findActivityById, findUnproductiveReasonById } from "@/lib/actions";
import EditTimesheetDialog from "./EditTimesheetDialog";

interface AdminDashboardProps {
  submissions: TimesheetSubmission[];
}

export default function AdminDashboard({ submissions }: AdminDashboardProps) {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<TimesheetSubmission | null>(null);
  const { toast } = useToast();

  const handleDelete = (submission: TimesheetSubmission) => {
    setSelectedSubmission(submission);
    setIsDeleteAlertOpen(true);
  };

  const handleEdit = (submission: TimesheetSubmission) => {
    setSelectedSubmission(submission);
    setIsEditDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedSubmission) {
      const result = await deleteTimesheet(selectedSubmission.id);
      if (result.success) {
        toast({ title: 'Submission deleted successfully.' });
        // Note: You'll need to refresh the page or handle state update to see the change
      } else {
        toast({ variant: 'destructive', title: 'Error deleting submission.' });
      }
      setIsDeleteAlertOpen(false);
      setSelectedSubmission(null);
    }
  };
  
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
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">All Timesheet Submissions</CardTitle>
          <CardDescription>Review all entries submitted by crew supervisors.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {submissions.map((submission) => (
              <SubmissionAccordionItem 
                key={submission.id}
                submission={submission}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected timesheet submission.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      {selectedSubmission && (
        <EditTimesheetDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            submission={selectedSubmission}
            onSubmissionUpdated={() => {
                setIsEditDialogOpen(false);
                setSelectedSubmission(null);
                toast({ title: "Submission updated successfully" });
            }}
         />
      )}
    </>
  );
}

interface SubmissionAccordionItemProps {
  submission: TimesheetSubmission;
  onEdit: (submission: TimesheetSubmission) => void;
  onDelete: (submission: TimesheetSubmission) => void;
}

function SubmissionAccordionItem({ submission, onEdit, onDelete }: SubmissionAccordionItemProps) {
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
        <div className="pl-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreVertical className="h-4 w-4" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onEdit(submission)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(submission)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
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
  );
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
