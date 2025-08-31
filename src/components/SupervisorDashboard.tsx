

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
import { Calendar, Users, Activity, Clock, Hash, Trash2, Copy, Edit, FileText, ListTodo, MapPin } from 'lucide-react';
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
    if (!initialSubmissions) return [];

    initialSubmissions.forEach(s => {
      const groupId = s.submissionGroupId || s.id; // Fallback for older data
      if (!groups[groupId]) {
        groups[groupId] = { id: groupId, entries: [], representative: s };
      }
      groups[groupId].entries.push(s);
    });

    return Object.values(groups).sort((a,b) => new Date(b.representative.submittedAt).getTime() - new Date(a.representative.submittedAt).getTime());
  }, [initialSubmissions]);

  const handleCopy = (submissionGroup: GroupedSubmission) => {
     const representative = submissionGroup.representative;
     const params = new URLSearchParams();
     params.set('zone', representative.zone || '');
     params.set('section', representative.section || '');
     params.set('asset', representative.asset);
     params.set('subAsset', representative.subAsset);
     params.set('activityId', representative.activityId);
     params.set('notes', representative.notes || '');

     const crewIds = submissionGroup.entries
        .map(e => e.crewMemberId)
        .filter(id => id !== representative.submittedById) || [];

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
          {groupedSubmissions.map((group) => (
            <AccordionItem value={group.id} key={group.id} className="border rounded-lg shadow-sm bg-background">
              <div className="flex items-center justify-between pl-6 pr-2 py-2">
                <AccordionTrigger className="flex-grow py-2 hover:no-underline">
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="font-semibold">{format(new Date(group.representative.timesheetDate), 'PPP')}</p>
                            <p className="text-xs text-muted-foreground">Date</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="font-semibold">{group.representative.zone} / {group.representative.section}</p>
                            <p className="text-xs text-muted-foreground">Location</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="font-semibold">{group.representative.activity?.activity}</p>
                            <p className="text-xs text-muted-foreground">Activity</p>
                        </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <div className="flex items-center gap-2 pl-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" className="h-9 w-9" disabled={!group.representative.submissionGroupId}>
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
                        <AlertDialogAction onClick={() => handleDeleteGroup(group.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleCopy(group)}>
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
                    <InfoItem icon={Users} label="Crew Members" value={group.entries.length} />
                    <InfoItem icon={FileText} label="Asset / Sub-Asset" value={`${group.representative.asset} / ${group.representative.subAsset}`} />
                    <InfoItem icon={Clock} label="Productive Hours" value={group.representative.productiveHours} />
                    <InfoItem icon={Hash} label="Quantity" value={group.representative.quantity} badge={group.representative.activity?.activityUom} />
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
                        {group.entries.map((entry) => (
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
