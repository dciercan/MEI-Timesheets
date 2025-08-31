

'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TimesheetSubmissionWithDetails } from "@/lib/types";
import { deleteTimesheetCrew } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import EditTimesheetDialog from "./EditTimesheetDialog";
import { useRouter } from 'next/navigation';
import { Calendar, Users, Activity, Clock, Hash, Trash2, Copy, Edit, FileText, ListTodo, MapPin, Watch } from 'lucide-react';
import InfoItem from './InfoItem';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import EditSubmissionCrewDialog from './EditSubmissionGroupDialog';


interface SupervisorDashboardProps {
  submissions: TimesheetSubmissionWithDetails[];
}

type CrewSubmission = {
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

  const [isCrewEditDialogOpen, setIsCrewEditDialogOpen] = React.useState(false);
  const [selectedCrew, setSelectedCrew] = React.useState<CrewSubmission | null>(null);

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

  const handleCrewEdit = (crew: CrewSubmission) => {
    setSelectedCrew(crew);
    setIsCrewEditDialogOpen(true);
  }

  const handleCrewSubmissionUpdated = () => {
    setIsCrewEditDialogOpen(false);
    setSelectedCrew(null);
    toast({ title: "Submission crew updated successfully" });
    router.refresh();
  };

  const handleDeleteCrew = async (crewId: string) => {
    const result = await deleteTimesheetCrew(crewId);
    if (result.success) {
      setSubmissions(submissions.filter(s => s.submissionCrewId !== crewId));
      toast({ title: "Submission crew deleted." });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  const crewSubmissions = React.useMemo(() => {
    if (!initialSubmissions) return [];
    
    const crews: Record<string, CrewSubmission> = {};
    
    initialSubmissions.forEach(s => {
      const crewId = s.submissionCrewId || `single-${s.id}`;
      if (!crews[crewId]) {
        crews[crewId] = { id: crewId, entries: [], representative: s };
      }
      crews[crewId].entries.push(s);
    });

    return Object.values(crews).sort((a,b) => new Date(b.representative.submittedAt).getTime() - new Date(a.representative.submittedAt).getTime());
  }, [initialSubmissions]);

  const handleCopy = (crewSubmission: CrewSubmission) => {
     const representative = crewSubmission.representative;
     const params = new URLSearchParams();
     params.set('zone', representative.zone || '');
     params.set('section', representative.section || '');
     params.set('asset', representative.asset);
     params.set('subAsset', representative.subAsset);
     params.set('activityId', representative.activityId);
     params.set('notes', representative.notes || '');

     const crewIds = crewSubmission.entries
        .map(e => e.crewMemberId)
        .filter(id => id !== representative.submittedById) || [];

     if (crewIds.length > 0) {
        params.set('crewMemberIds', JSON.stringify(crewIds));
     }
     
     router.push(`/timesheet?${params.toString()}`);
  }

  if (crewSubmissions.length === 0) {
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
          {crewSubmissions.map((crew) => {
            const totalUnproductiveMinutes = crew.representative.unproductiveEntries?.reduce((total, entry) => total + entry.hours, 0) || 0;

            return (
            <AccordionItem value={crew.id} key={crew.id} className="border rounded-lg shadow-sm bg-background">
              <div className="flex items-center justify-between pl-6 pr-2 py-2">
                <AccordionTrigger className="flex-grow py-2 hover:no-underline">
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="font-semibold">{format(new Date(crew.representative.timesheetDate), 'PPP')}</p>
                            <p className="text-xs text-muted-foreground">Date</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="font-semibold">{crew.representative.zone} / {crew.representative.section}</p>
                            <p className="text-xs text-muted-foreground">Location</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="font-semibold">{crew.representative.activity?.activity}</p>
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
                              <Button variant="outline" size="icon" className="h-9 w-9" disabled={!crew.representative.submissionCrewId}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                             <TooltipContent>
                              <p>Delete Submission Crew</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this submission crew and all its entries.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteCrew(crew.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                   <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleCrewEdit(crew)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                        <p>Edit</p>
                        </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleCopy(crew)}>
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
                    <InfoItem icon={Hash} label="Crew ID" value={crew.id} />
                    <InfoItem icon={Users} label="Crew Members" value={crew.entries.length} />
                    <InfoItem icon={FileText} label="Asset / Sub-Asset" value={`${crew.representative.asset} / ${crew.representative.subAsset}`} />
                    <InfoItem icon={Clock} label="Productive Hours" value={crew.representative.productiveHours} />
                    <InfoItem icon={Hash} label="Quantity" value={crew.representative.quantity} badge={crew.representative.activity?.activityUom} />
                    <InfoItem icon={Watch} label="Unproductive Time" value={totalUnproductiveMinutes} badge="minutes" />
                 </div>
                
                 <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Crew Member</TableHead>
                            <TableHead>Timesheet ID</TableHead>
                            <TableHead className="text-right">Total Hours</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {crew.entries.map((entry) => {
                            const totalUnproductiveMinutesForEntry = entry.unproductiveEntries?.reduce((total, u) => total + u.hours, 0) || 0;
                            const totalUnproductiveHoursForEntry = totalUnproductiveMinutesForEntry / 60;
                            const totalHours = entry.productiveHours + totalUnproductiveHoursForEntry;
                            return (
                                <TableRow key={entry.id}>
                                <TableCell>{entry.crewMember?.fullName}</TableCell>
                                <TableCell className="font-mono text-xs">{entry.id}</TableCell>
                                <TableCell className="text-right font-medium">{totalHours.toFixed(2)}</TableCell>
                                </TableRow>
                            );
                        })}
                        </TableBody>
                    </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
            );
          })}
        </Accordion>

        {selectedEntry && (
          <EditTimesheetDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            submission={selectedEntry}
            onSubmissionUpdated={handleSubmissionUpdated}
          />
        )}
        {selectedCrew && (
            <EditSubmissionCrewDialog
                isOpen={isCrewEditDialogOpen}
                onOpenChange={setIsCrewEditDialogOpen}
                submissionCrew={selectedCrew}
                onSubmissionUpdated={handleCrewSubmissionUpdated}
            />
        )}
      </CardContent>
    </Card>
  );
}
