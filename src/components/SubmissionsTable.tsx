

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
  VisibilityState,
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
import type { CrewDocketWithDetails } from '@/lib/types';
import { deleteCrewDocket } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import EditSubmissionGroupDialog from './EditSubmissionGroupDialog';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

interface SubmissionsTableProps {
    dockets: CrewDocketWithDetails[];
}

export default function SubmissionsTable({ dockets: initialDockets }: SubmissionsTableProps) {
  const [dockets, setDockets] = React.useState(initialDockets);
  const [sorting, setSorting] = React.useState<SortingState>([ { id: 'timesheetDate', desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedDocket, setSelectedDocket] = React.useState<CrewDocketWithDetails | null>(null);
  const { toast } = useToast();

  const handleEdit = (docket: CrewDocketWithDetails) => {
    setSelectedDocket(docket);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (docket: CrewDocketWithDetails) => {
    setSelectedDocket(docket);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedDocket) {
      const result = await deleteCrewDocket(selectedDocket.id);
      if (result.success) {
        setDockets(dockets.filter(s => s.id !== selectedDocket.id));
        toast({ title: 'Crew Docket deleted successfully.' });
      } else {
        toast({ variant: 'destructive', title: 'Error deleting docket.' });
      }
      setIsDeleteAlertOpen(false);
      setSelectedDocket(null);
    }
  };
  
  const handleSubmissionUpdated = () => {
    setIsEditDialogOpen(false);
    setSelectedDocket(null);
    toast({ title: "Crew Docket updated successfully" });
    router.refresh();
  };

  const columns: ColumnDef<CrewDocketWithDetails>[] = [
    {
        accessorKey: 'timesheetDate',
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                Date <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => format(new Date(row.getValue('timesheetDate')), 'PPP')
    },
    {
        accessorKey: 'company',
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                Company <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        )
    },
    {
      accessorKey: 'crewMembers',
      header: 'Crew Size',
      cell: ({ row }) => row.original.crewMembers.length,
    },
    { accessorKey: 'asset', header: 'Asset' },
    { accessorKey: 'subAsset', header: 'Sub-Asset' },
    {
       accessorKey: 'activity.activity',
       header: 'Activity',
       cell: ({ row }) => row.original.activity?.activity || 'N/A'
    },
    {
        accessorKey: 'productiveHours',
        header: 'Hours',
        cell: ({ row }) => row.original.timesheets[0]?.productiveHours || 0,
    },
    {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => `${row.original.quantity} ${row.original.activity?.activityUom || ''}`.trim()
    },
    { accessorKey: 'zone', header: 'Zone' },
    { accessorKey: 'section', header: 'Section' },
    { accessorKey: 'notes', header: 'Notes' },
    {
        accessorKey: 'submittedBy.fullName',
        header: 'Submitted By',
        cell: ({ row }) => row.original.submittedBy?.fullName || 'N/A'
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const docket = row.original;
        if (currentUser?.appRole === 'Read Only') return null;
        
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
                    <DropdownMenuItem onClick={() => handleEdit(docket)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(docket)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: dockets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
        pagination: { pageSize: 20 },
    },
    state: {
      sorting,
      columnFilters,
    },
  });


  return (
    <>
        <div className="flex items-center gap-4 py-4">
            <Input
              placeholder="Filter by company..."
              value={(table.getColumn('company')?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                  table.getColumn('company')?.setFilterValue(event.target.value)
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
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                Next
            </Button>
        </div>
        
        {/* Dialogs */}
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the selected crew docket and all associated timesheets.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {selectedDocket && (
            <EditSubmissionGroupDialog
                isOpen={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                docket={selectedDocket}
                onSubmissionUpdated={handleSubmissionUpdated}
            />
        )}
    </>
  );
}
