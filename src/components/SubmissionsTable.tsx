
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, ArrowUpDown, Trash2, Edit } from 'lucide-react';
import type { TimesheetSubmissionWithDetails } from '@/lib/types';
import { deleteTimesheet } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import EditTimesheetDialog from './EditTimesheetDialog';

interface SubmissionsTableProps {
    submissions: TimesheetSubmissionWithDetails[];
}

export default function SubmissionsTable({ submissions: initialSubmissions }: SubmissionsTableProps) {
  const [submissions, setSubmissions] = React.useState(initialSubmissions);
  const [sorting, setSorting] = React.useState<SortingState>([ { id: 'timesheetDate', desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedSubmission, setSelectedSubmission] = React.useState<TimesheetSubmissionWithDetails | null>(null);
  const { toast } = useToast();


  const handleEdit = (submission: TimesheetSubmissionWithDetails) => {
    setSelectedSubmission(submission);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (submission: TimesheetSubmissionWithDetails) => {
    setSelectedSubmission(submission);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedSubmission) {
      const result = await deleteTimesheet(selectedSubmission.id);
      if (result.success) {
        setSubmissions(submissions.filter(s => s.id !== selectedSubmission.id));
        toast({ title: 'Submission deleted successfully.' });
      } else {
        toast({ variant: 'destructive', title: 'Error deleting submission.' });
      }
      setIsDeleteAlertOpen(false);
      setSelectedSubmission(null);
    }
  };
  
  const handleSubmissionUpdated = () => {
    setIsEditDialogOpen(false);
    setSelectedSubmission(null);
    toast({ title: "Submission updated successfully" });
    // For simplicity, we just reload the page to get fresh data.
    // A more sophisticated approach would be to refetch or update the state.
    window.location.reload();
  };


  const columns: ColumnDef<TimesheetSubmissionWithDetails>[] = [
    {
      accessorKey: 'crewMember.fullName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Crew Member
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
       cell: ({ row }) => row.original.crewMember?.fullName || 'N/A'
    },
    {
      accessorKey: 'timesheetDate',
      header: ({ column }) => (
          <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
              Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
      ),
      cell: ({ row }) => format(new Date(row.getValue('timesheetDate')), 'PPP')
    },
    {
       accessorKey: 'activity.activity',
       header: 'Activity',
       cell: ({ row }) => row.original.activity?.activity || 'N/A'
    },
    {
        accessorKey: 'productiveHours',
        header: 'Hours',
    },
    {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => `${row.original.quantity} ${row.original.activity?.activityUom || ''}`.trim()
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const submission = row.original;
        return (
          <div className='text-right'>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleEdit(submission)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(submission)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: submissions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <>
        <div className="flex items-center gap-4 py-4">
            <Input
            placeholder="Filter by crew member..."
            value={(table.getColumn('crewMember_fullName')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
                table.getColumn('crewMember_fullName')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
            />
             <Input
            placeholder="Filter by activity..."
            value={(table.getColumn('activity_activity')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
                table.getColumn('activity_activity')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
            />
        </div>
        <div className="rounded-md border">
            <Table>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                    return (
                        <TableHead key={header.id} className={header.id === 'actions' ? 'text-right' : ''}>
                        {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                            )}
                        </TableHead>
                    );
                    })}
                </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                    <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    >
                    {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                    ))}
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
            >
                Previous
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
            >
                Next
            </Button>
        </div>
        
        {/* Dialogs */}
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
                onSubmissionUpdated={handleSubmissionUpdated}
            />
        )}
    </>
  );
}

