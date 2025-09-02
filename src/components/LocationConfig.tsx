

'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
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
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, PlusCircle, Loader2, ArrowUpDown, Upload, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from './ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { deleteLocation, getLocations, saveLocation, toggleLocationStatus } from '@/lib/actions';
import type { Location } from '@/lib/types';
import LocationImporter from './LocationImporter';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface LocationConfigProps {
  locations: Location[];
}

const locationFormSchema = z.object({
    id: z.string().optional(),
    zone: z.string().min(1, 'Zone is required'),
    section: z.string().min(1, 'Section is required'),
    isActive: z.boolean().default(true),
});
type LocationFormData = z.infer<typeof locationFormSchema>;

export default function LocationConfig({ locations: initialLocations }: LocationConfigProps) {
    const [locations, setLocations] = React.useState(initialLocations);
    const { toast } = useToast();
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isImporterOpen, setIsImporterOpen] = React.useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
    const [selectedLocation, setSelectedLocation] = React.useState<Location | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);
    
    const form = useForm<LocationFormData>({
        resolver: zodResolver(locationFormSchema),
        defaultValues: { zone: '', section: '', isActive: true },
    });

    const uniqueZones = React.useMemo(() => [...new Set(initialLocations.map(l => l.zone))], [initialLocations]);

    const refetchData = async () => {
      const refreshedLocations = await getLocations();
      setLocations(refreshedLocations);
    }

    const handleToggleActive = async (locationId: string, currentStatus: boolean) => {
        const result = await toggleLocationStatus(locationId, !currentStatus);
        if (result.success) {
            toast({ title: `Location status updated.` });
            await refetchData();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    }

    const handleAddNew = () => {
        setSelectedLocation(null);
        form.reset({ zone: '', section: '', isActive: true });
        setIsFormOpen(true);
    };
    
    const handleEdit = (location: Location) => {
        setSelectedLocation(location);
        form.reset(location);
        setIsFormOpen(true);
    };

    const handleDelete = (location: Location) => {
        setSelectedLocation(location);
        setIsDeleteAlertOpen(true);
    };
    
    const handleImportFinished = async () => {
        setIsImporterOpen(false);
        await refetchData();
    }


    const confirmDelete = async () => {
        if (selectedLocation) {
            const result = await deleteLocation(selectedLocation.id);
            if (result.success) {
                toast({ title: 'Location deleted successfully.' });
                await refetchData();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
            setIsDeleteAlertOpen(false);
            setSelectedLocation(null);
        }
    };

    const onSubmit = async (data: LocationFormData) => {
        setIsSaving(true);
        const result = await saveLocation(data);
        if (result.success) {
            toast({ title: `Location ${data.id ? 'updated' : 'created'} successfully.` });
            await refetchData();
            setIsFormOpen(false);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setIsSaving(false);
    };


    const columns: ColumnDef<Location>[] = [
        {
            accessorKey: 'zone',
            header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Zone <ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
        },
        {
            accessorKey: 'section',
            header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Section <ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
        },
        {
            accessorKey: 'isActive',
            header: 'Active',
            cell: ({ row }) => {
                const location = row.original;
                return (
                    <Switch
                        checked={location.isActive}
                        onCheckedChange={() => handleToggleActive(location.id, location.isActive)}
                        aria-label="Toggle location status"
                    />
                )
            }
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const location = row.original;
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
                        <DropdownMenuItem onClick={() => handleEdit(location)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(location)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                );
            },
        },
    ];

    const table = useReactTable({
        data: locations,
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
    
    const zoneFilterValue = table.getColumn('zone')?.getFilterValue() as string;

  return (
    <>
        <div className='flex items-center justify-between py-4'>
            <div className="flex items-center gap-2">
                <Select 
                    value={zoneFilterValue ?? ''}
                    onValueChange={(value) => {
                        table.getColumn('zone')?.setFilterValue(value === 'all-zones' ? '' : value);
                    }}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by zone..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all-zones">All Zones</SelectItem>
                        {uniqueZones.map(zone => (
                            <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 {zoneFilterValue && (
                    <Button variant="ghost" onClick={() => table.getColumn('zone')?.setFilterValue('')}>
                        Clear
                        <X className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
            <div className="flex gap-2">
                <Button onClick={() => setIsImporterOpen(true)} variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import from CSV
                </Button>
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Location
                </Button>
            </div>
        </div>
        <div className="rounded-md border">
            <Table>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                    No locations configured.
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

        {/* Importer Dialog */}
        <LocationImporter 
            isOpen={isImporterOpen} 
            onOpenChange={setIsImporterOpen} 
            onImportFinished={handleImportFinished}
        />

        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{selectedLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
                    <DialogDescription>
                        {selectedLocation ? "Update the location details below." : "Add a new location."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="zone" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Zone</FormLabel>
                                <FormControl><Input placeholder="e.g. S6" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="section" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Section</FormLabel>
                                <FormControl><Input placeholder="e.g. M099" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Active</FormLabel>
                                        <DialogDescription>
                                            Inactive locations will not appear on the timesheet entry form.
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
                        This action cannot be undone. This will permanently delete the location <span className='font-bold'>{selectedLocation?.zone} / {selectedLocation?.section}</span>.
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
