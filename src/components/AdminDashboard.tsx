

'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CrewDocketWithDetails } from "@/lib/types";
import { deleteCrewDocket } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useRouter } from 'next/navigation';
import { Calendar, Users, Activity, Clock, Hash, Trash2, Copy, Edit, FileText, ListTodo, MapPin, Watch, ShieldCheck, Building, User, Archive } from 'lucide-react';
import InfoItem from './InfoItem';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import EditSubmissionGroupDialog from './EditSubmissionGroupDialog';
import SubmissionsTable from './SubmissionsTable';

interface AdminDashboardProps {
  dockets: CrewDocketWithDetails[];
  title: string;
  description: string;
}

export default function AdminDashboard({ dockets, title, description }: AdminDashboardProps) {
  const { toast } = useToast();
  const router = useRouter();

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedDocket, setSelectedDocket] = React.useState<CrewDocketWithDetails | null>(null);

  const handleEdit = (docket: CrewDocketWithDetails) => {
    setSelectedDocket(docket);
    setIsEditDialogOpen(true);
  }

  const handleSubmissionUpdated = () => {
    setIsEditDialogOpen(false);
    setSelectedDocket(null);
    toast({ title: "Crew Docket updated successfully" });
    router.refresh();
  };

  const handleDelete = async (docketId: string) => {
    const result = await deleteCrewDocket(docketId);
    if (result.success) {
      toast({ title: "Crew Docket deleted." });
      router.refresh();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  if (dockets.length === 0) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-3xl">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center h-[40vh] text-center">
                    <ListTodo className="h-16 w-16 text-muted-foreground" />
                    <h2 className="mt-4 text-2xl font-semibold font-headline">No Dockets Submitted Yet</h2>
                    <p className="mt-2 text-muted-foreground">Check back later to see submitted dockets.</p>
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
