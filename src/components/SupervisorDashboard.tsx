

'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CrewDocketWithDetails, CrewDocketStatus } from "@/lib/types";
import { deleteCrewDocket, updateDocketStatus } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInMinutes } from "date-fns";
import { useRouter } from 'next/navigation';
import { Calendar, Users, Activity, Clock, Hash, Trash2, Copy, Edit, FileText, ListTodo, MapPin, Watch, ShieldCheck, CheckCircle, XCircle, Building, User, Archive } from 'lucide-react';
import InfoItem from './InfoItem';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import EditSubmissionGroupDialog from './EditSubmissionGroupDialog';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface SupervisorDashboardProps {
  dockets: CrewDocketWithDetails[];
  onDocketDeleted: (docketId: string) => void;
}

export default function SupervisorDashboard({ dockets, onDocketDeleted }: SupervisorDashboardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [isCrewEditDialogOpen, setIsCrewEditDialogOpen] = React.useState(false);
  const [selectedCrew, setSelectedCrew] = React.useState<CrewDocketWithDetails | null>(null);

  const handleCrewEdit = (crew: CrewDocketWithDetails) => {
    setSelectedCrew(crew);
    setIsCrewEditDialogOpen(true);
  }

  const handleCrewSubmissionUpdated = () => {
    setIsCrewEditDialogOpen(false);
    setSelectedCrew(null);
    toast({ title: "Crew Docket updated successfully" });
    router.refresh();
  };

  const handleDeleteCrew = async (crewId: string) => {
    if (!currentUser) return;
    const result = await deleteCrewDocket(currentUser.id, crewId);
    if (result.success) {
      toast({ title: "Crew Docket deleted." });
      onDocketDeleted(crewId); // Use the callback to update parent state
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  const handleStatusUpdate = async (docketId: string, status: 'Approved' | 'Rejected') => {
    if (!currentUser) return;
    const result = await updateDocketStatus(currentUser.id, docketId, status);
    if (result.success) {
        toast({ title: result.message });
        router.refresh();
    } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  const handleCopy = (crewDocket: CrewDocketWithDetails) => {
     const params = new URLSearchParams();
     params.set('zone', crewDocket.zone || '');
     params.set('section', crewDocket.section || '');
     params.set('asset', crewDocket.asset);
     params.set('subAsset', crewDocket.subAsset);
     params.set('activityId', crewDocket.activityId);
     params.set('notes', crewDocket.notes || '');

     const crewIds = crewDocket.crewMemberIds.filter(id => id !== crewDocket.submittedById) || [];
     if (crewIds.length > 0) {
        params.set('crewMemberIds', JSON.stringify(crewIds));
     }
     
     router.push(`/timesheet?${params.toString()}`);
  }

  const statusBadgeVariant = (status: CrewDocketStatus) => {
    switch (status) {
        case 'Submitted': return 'warning';
        case 'Approved': return 'default';
        case 'Rejected': return 'destructive';
        case 'Processed': return 'outline';
        default: return 'secondary';
    }
  }

  if (dockets.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <ListTodo className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold font-headline">No Crew Dockets Found</h2>
            <p className="mt-2 text-muted-foreground">There are no dockets that match the current filter.</p>
        </div>
    );
  }

  const isMeiSupervisor = currentUser?.appRole === 'MEI Supervisor';
  const pageTitle = isMeiSupervisor ? "Docket Approvals" : "My Crew Dockets";
  const pageDescription = isMeiSupervisor 
    ? "Review, approve, or reject dockets submitted by crew supervisors." 
    : "A record of all crew dockets you have submitted.";


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">{pageTitle}</CardTitle>
        <CardDescription>{pageDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {dockets.map((docket) => {
            const totalUnproductiveMinutes = docket.timesheets[0]?.unproductiveEntries?.reduce((total, entry) => total + entry.minutes, 0) || 0;
            const productiveHours = docket.timesheets[0]?.productiveHours || 0;
            const canApproveReject = isMeiSupervisor && docket.status === 'Submitted';
            const canEdit = currentUser?.appRole === 'Crew Supervisor' && (docket.status === 'Rejected' || docket.status === 'Submitted');
            const canDelete = currentUser?.appRole === 'Crew Supervisor' && (docket.status === 'Rejected' || docket.status === 'Submitted');
            const representativeTimesheet = docket.timesheets[0];
            
            return (
            <AccordionItem value={docket.id} key={docket.id} className="border rounded-lg shadow-sm bg-background">
              <div className="flex flex-col md:flex-row items-center justify-between pl-4 pr-2 py-2">
                <AccordionTrigger className="flex-grow py-2 hover:no-underline w-full">
                   <div className="grid grid-cols-2 md:grid-cols-none md:flex flex-grow items-center gap-x-4 gap-y-2 text-left w-full">
                     <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="font-semibold text-sm">{format(new Date(docket.timesheetDate), 'dd/MM/yy')}</p>
                            <p className="text-xs text-muted-foreground">Date</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="font-semibold text-sm">{docket.zone} / {docket.section}</p>
                            <p className="text-xs text-muted-foreground">Location</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 col-span-2">
                        <Archive className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="font-semibold text-sm">{docket.asset} / {docket.subAsset}</p>
                            <p className="text-xs text-muted-foreground">Asset / Sub-Asset</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 col-span-2">
                        <Activity className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="font-semibold text-sm">{docket.activity?.activity || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">Activity</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Hash className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="font-semibold text-sm">{`${docket.quantity} ${docket.activity?.activityUom || ''}`.trim()}</p>
                            <p className="text-xs text-muted-foreground">Quantity</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="font-semibold text-sm">{productiveHours}</p>
                            <p className="text-xs text-muted-foreground">Productive Hours</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-primary"/>
                        <div>
                             <Badge variant={statusBadgeVariant(docket.status)} className={cn('text-sm', docket.status === 'Approved' && 'bg-green-600')}>{docket.status}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">Status</p>
                        </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <div className="flex items-center gap-2 pl-4 md:pl-0 pt-2 md:pt-0 border-t md:border-t-0 md:border-l w-full md:w-auto justify-end md:justify-center md:ml-4">
                  {canApproveReject && (
                    <>
                      <TooltipProvider>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <Button variant="outline" size="icon" className="h-9 w-9 border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600" onClick={() => handleStatusUpdate(docket.id, 'Approved')}>
                                      <CheckCircle className="h-4 w-4" />
                                  </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Approve</p></TooltipContent>
                          </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <Button variant="outline" size="icon" className="h-9 w-9 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleStatusUpdate(docket.id, 'Rejected')}>
                                      <XCircle className="h-4 w-4" />
                                  </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Reject</p></TooltipContent>
                          </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                  {!isMeiSupervisor && (
                    <AlertDialog>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9" disabled={!canDelete} asChild>
                                <AlertDialogTrigger>
                                     <Trash2 className="h-4 w-4" />
                                </AlertDialogTrigger>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{canDelete ? 'Delete Crew Docket' : 'Cannot delete approved dockets'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this crew docket and all associated timesheets.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCrew(docket.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                   <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleCrewEdit(docket)} disabled={!canEdit}>
                                <Edit className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                        <p>{canEdit ? 'Edit Docket' : 'Edit (Disabled)'}</p>
                        </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleCopy(docket)}>
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
                    <InfoItem icon={Hash} label="Docket ID" value={docket.id} />
                    <InfoItem icon={Building} label="Company" value={docket.company} />
                    <InfoItem icon={User} label="Supervisor" value={docket.submittedBy?.fullName} />
                    {representativeTimesheet && <InfoItem icon={Clock} label="Shift Start" value={format(new Date(representativeTimesheet.shiftStart), 'Pp')} />}
                    {representativeTimesheet && <InfoItem icon={Clock} label="Shift End" value={format(new Date(representativeTimesheet.shiftEnd), 'Pp')} />}
                    <InfoItem icon={Watch} label="Unproductive Time" value={totalUnproductiveMinutes} badge="minutes per person" />
                    <InfoItem icon={Users} label="Crew Members" value={docket.crewMembers.length} />
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
                        {docket.timesheets.map((entry) => {
                            const shiftStart = new Date(entry.shiftStart);
                            const shiftEnd = new Date(entry.shiftEnd);
                            const diffMins = differenceInMinutes(shiftEnd, shiftStart);
                            const totalHours = diffMins / 60;
                            const crewMember = docket.crewMembers.find(cm => cm.id === entry.crewMemberId);
                            return (
                                <TableRow key={entry.id}>
                                <TableCell>{crewMember?.fullName || 'Unknown'}</TableCell>
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

        {selectedCrew && (
            <EditSubmissionGroupDialog
                isOpen={isCrewEditDialogOpen}
                onOpenChange={setIsCrewEditDialogOpen}
                docket={selectedCrew}
                onSubmissionUpdated={handleCrewSubmissionUpdated}
            />
        )}
      </CardContent>
    </Card>
  );
}
