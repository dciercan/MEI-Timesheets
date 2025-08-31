
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TimesheetSubmissionWithDetails } from "@/lib/types";
import { deleteTimesheetGroup } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import EditTimesheetDialog from "./EditTimesheetDialog";
import { useRouter } from 'next/navigation';
import { Calendar, Users, Activity, Clock, Hash, Trash2, Copy, Edit, FileText, ListTodo } from 'lucide-react';
import InfoItem from './InfoItem';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';


interface SupervisorDashboardProps {
  submissions: TimesheetSubmissionWithDetails[];
}

type GroupedSubmission = {
  id: string;
  entries: TimesheetSubmissionWithDetails[];
  representative: TimesheetSubmissionWithDetails;
}

export default function SupervisorDashboard({ submissions: initialSubmissions }: SupervisorDashboardProps) {
  const [submissions, setSubmissions] = React.useState(initialSubmissions);
  const { toast } = useToast();
  const router = useRouter();

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<TimesheetSubmissionWithDetails | null>(null);

  const handleEdit = (entry: TimesheetSubmissionWithDetails) => {
    setSelectedEntry(entry);
    setIsEditDialogOpen(true);
  };
  
  const handleSubmissionUpdated = () => {
    setIsEditDialogOpen(false);
    setSelectedEntry(null);
    toast({ title: "Submission updated successfully" });
    router.refresh();
  };

  const handleDeleteGroup = async (groupId: string) => {
    const result = await deleteTimesheetGroup(groupId);
    if (result.success) {
      setSubmissions(submissions.filter(s => s.submissionGroupId !== groupId));
      toast({ title: "Submission group deleted." });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  const groupedSubmissions = React.useMemo(() => {
    const groups: Record<string, GroupedSubmission> = {};
    submissions.forEach(s => {
      // Use submissionGroupId if it exists, otherwise use the entry's own ID as a fallback.
      // This ensures every entry is part of a group, even if it's a group of one.
      const groupId = s.submissionGroupId || s.id;
      if (!groups[groupId]) {
        groups[groupId] = {
          id: groupId,
          entries: [],
          representative: s
        };
      }
      groups[groupId].entries.push(s);
    });
    return Object.values(groups).sort((a,b) => new Date(b.representative.submittedAt).getTime() - new Date(a.representative.submittedAt).getTime());
  }, [submissions]);

  const handleCopy = (submission: TimesheetSubmissionWithDetails) => {
     const params = new URLSearchParams();
     params.set('date', submission.timesheetDate.toISOString());
     params.set('zone', submission.zone || '');
     params.set('section', submission.section || '');
     params.set('asset', submission.asset);
     params.set('subAsset', submission.subAsset);
     params.set('activityId', submission.activityId);
     params.set('productiveHours', submission.productiveHours.toString());
     params.set('quantity', submission.quantity.toString());
     params.set('notes', submission.notes || '');

     const crewIds = groupedSubmissions
        .find(g => g.id === (submission.submissionGroupId || submission.id))?.entries
        .map(e => e.crewMemberId)
        .filter(id => id !== submission.submittedById) || [];

     params.set('crewMemberIds', JSON.stringify(crewIds));
     
     router.push(`/timesheet?${params.toString()}`);
  }

  if (groupedSubmissions.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <ListTodo className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold font-headline">No Timesheets Submitted Yet</h2>
            <p className="mt-2 text-muted-foreground">Once you submit timesheets, they will appear here.</p>
        </div>
    );
  }


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">My Timesheet Submissions</CardTitle>
        <CardDescription>A record of all timesheets you have submitted, grouped by submission.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {groupedSubmissions.map(({ id, entries, representative }) => (
            <AccordionItem value={id} key={id} className="border rounded-lg shadow-sm bg-background">
              <div className="flex items-center justify-between pl-6 pr-2 py-2">
                <AccordionTrigger className="flex-grow py-2 hover:no-underline">
                  <div className="flex gap-6 items-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold font-headline">{new Date(representative.timesheetDate).getDate()}</p>
                      <p className="text-sm uppercase text-muted-foreground">{format(new Date(representative.timesheetDate), 'MMM')}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-left">{representative.activity?.activity}</h4>
                      <p className="text-sm text-muted-foreground text-left">{representative.asset} / {representative.subAsset}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <div className="flex items-center gap-2 pl-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" className="h-9 w-9" disabled={!representative.submissionGroupId}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                             <TooltipContent>
                              <p>Delete Submission Group</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this submission group and all its entries.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteGroup(id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleCopy(representative)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                        <p>Copy to New Timesheet Entry</p>
                        </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <AccordionContent className="px-6 pb-4">
                 <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 pt-4 border-t">
                    <InfoItem icon={Calendar} label="Timesheet Date" value={format(new Date(representative.timesheetDate), 'PPP')} />
                    <InfoItem icon={Users} label="Crew Members" value={entries.length} />
                    <InfoItem icon={Activity} label="Activity" value={representative.activity?.activity} />
                    <InfoItem icon={FileText} label="Asset / Sub-Asset" value={`${representative.asset} / ${representative.subAsset}`} />
                    <InfoItem icon={Clock} label="Productive Hours" value={representative.productiveHours} />
                    <InfoItem icon={Hash} label="Quantity" value={representative.quantity} badge={representative.activity?.activityUom} />
                 </div>
                
                 <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Crew Member</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {entries.map((entry) => (
                            <TableRow key={entry.id}>
                            <TableCell>{entry.crewMember?.fullName}</TableCell>
                            <TableCell>{entry.crewMember?.company}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                                <Edit className="h-4 w-4" />
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {selectedEntry && (
          <EditTimesheetDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            submission={selectedEntry}
            onSubmissionUpdated={handleSubmissionUpdated}
          />
        )}
      </CardContent>
    </Card>
  );
}
