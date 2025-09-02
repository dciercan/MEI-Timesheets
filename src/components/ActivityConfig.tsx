

'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ArrowUpDown, Edit, Trash2, PlusCircle, Loader2, X, Upload } from 'lucide-react';
import type { Activity } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from './ui/dropdown-menu';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { deleteActivity, getActivities, saveActivity, toggleActivityStatus } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import ActivityImporter from './ActivityImporter';
import { Switch } from './ui/switch';

interface ActivityConfigProps {
  activities: Activity[];
}

const activityFormSchema = z.object({
    id: z.string().optional(),
    asset: z.string().min(1, 'Asset is required'),
    subAsset: z.string().min(1, 'Sub-Asset is required'),
    activity: z.string().min(1, 'Activity is required'),
    activityUom: z.string().min(1, 'UoM is required'),
    wbsCode: z.string().min(1, 'WBS Code is required'),
    isActive: z.boolean().default(true),
    // These are part of the model but not edited here
    contract: z.string().optional(),
    zone: z.string().optional(),
    section: z.string().optional(),
});
type ActivityFormData = z.infer<typeof activityFormSchema>;


export default function ActivityConfig({ activities: initialActivities }: ActivityConfigProps) {
  const [activities, setActivities] = React.useState(initialActivities);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const { toast } = useToast();
  const router = useRouter();

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isImporterOpen, setIsImporterOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedActivity, setSelectedActivity] = React.useState<Activity | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      asset: '',
      subAsset: '',
      activity: '',
      activityUom: '',
      wbsCode: '',
      isActive: true,
    },
  });

  const refetchData = async () => {
    const data = await getActivities();
    setActivities(data);
  }
  
  const handleImportFinished = async () => {
    setIsImporterOpen(false);
    await refetchData();
  }

  const handleToggleActive = async (activityId: string, currentStatus: boolean) => {
    const result = await toggleActivityStatus(activityId, !currentStatus);
    if (result.success) {
        toast({ title: `Activity status updated.` });
        await refetchData();
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }

  const handleAddNew = () => {
    setSelectedActivity(null);
    form.reset({ asset: '', subAsset: '', activity: '', activityUom: '', wbsCode: '', isActive: true });
    setIsFormOpen(true);
  };

  const handleEdit = (activity: Activity) => {
    setSelectedActivity(activity);
    form.reset(activity);
    setIsFormOpen(true);
  };

  const handleDelete = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedActivity) {
      const result = await deleteActivity(selectedActivity.id);
      if (result.success) {
        toast({ title: 'Activity deleted successfully.' });
        await refetchData();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
      setIsDeleteAlertOpen(false);
      setSelectedActivity(null);
    }
  };

  const onSubmit = async (data: ActivityFormData) => {
    setIsSaving(true);
    const result = await saveActivity(data);
    if (result.success) {
        toast({ title: `Activity ${data.id ? 'updated' : 'created'} successfully.` });
        await refetchData();
        setIsFormOpen(false);
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsSaving(false);
  };

  const columns: ColumnDef<Activity>[] = [
    {
        accessorKey: 'asset',
        header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Asset <ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
    },
    {
        accessorKey: 'subAsset',
        header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Sub-Asset <ArrowUpDown className="ml-2 h-4 w-4" /></Button>,

    },
    {
        accessorKey: 'activity',
        header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Activity <ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
    },
    {
        accessorKey: 'activityUom',
        header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>UoM <ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
    },
    {
        accessorKey: 'wbsCode',
        header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>WBS Code <ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
    },
    {
        accessorKey: 'isActive',
        header: 'Active',
        cell: ({ row }) => {
            const activity = row.original;
            return (
                <Switch
                    checked={activity.isActive}
                    onCheckedChange={() => handleToggleActive(activity.id, activity.isActive)}
                    aria-label="Toggle activity status"
                />
            )
        }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const activity = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleEdit(activity)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(activity)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: activities,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
    initialState: { pagination: { pageSize: 10 } },
  });

  const FilterInput = ({ columnId }: { columnId: string }) => {
    const column = table.getColumn(columnId);
    const [value, setValue] = React.useState((column?.getFilterValue() as string) ?? '');

    React.useEffect(() => {
        setValue((column?.getFilterValue() as string) ?? '');
    }, [column?.getFilterValue()])

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            column?.setFilterValue(value);
        }
    };
    
    const handleClear = () => {
        setValue('');
        column?.setFilterValue('');
    }

    return (
        <div className="relative">
            <Input
                placeholder={`Filter ${columnId}...`}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={handleKeyDown}
                className="max-w-full h-8 pr-8"
            />
            {value && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute h-8 w-8 right-0 top-0"
                    onClick={handleClear}
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
  }

  return (
    <>
        <div className="flex items-center justify-end py-4 space-x-2">
            <Button onClick={() => setIsImporterOpen(true)} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import from CSV
            </Button>
            <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4"/>
                Add Activity
            </Button>
        </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                        <div>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanFilter() && !header.isPlaceholder && header.id !== 'actions' && header.id !== 'isActive' && (
                                <div className="mt-2">
                                    <FilterInput columnId={header.column.id} />
                                </div>
                            )}
                        </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
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
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                Next
                </Button>
            </div>
        </div>
      </div>

       {/* Importer Dialog */}
       <ActivityImporter 
            isOpen={isImporterOpen} 
            onOpenChange={setIsImporterOpen} 
            onImportFinished={handleImportFinished}
        />

       {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{selectedActivity ? 'Edit Activity' : 'Add New Activity'}</DialogTitle>
                    <DialogDescription>
                        {selectedActivity ? "Update the activity details below." : "Enter details for the new activity."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="asset" render={({ field }) => (
                            <FormItem><FormLabel>Asset</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="subAsset" render={({ field }) => (
                            <FormItem><FormLabel>Sub-Asset</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField control={form.control} name="activity" render={({ field }) => (
                            <FormItem><FormLabel>Activity</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField control={form.control} name="activityUom" render={({ field }) => (
                            <FormItem><FormLabel>Unit of Measure (UoM)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="wbsCode" render={({ field }) => (
                            <FormItem><FormLabel>WBS Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Active</FormLabel>
                                        <DialogDescription>
                                            Inactive activities will not appear on the timesheet entry form.
                                        </DialogDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                       
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the activity: <span className='font-bold'>{selectedActivity?.activity}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
