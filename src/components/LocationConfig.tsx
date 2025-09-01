

'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState
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
import { MoreHorizontal, Edit, Trash2, PlusCircle, Loader2, ArrowUpDown, Upload } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from './ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { deleteLocation, getLocations, saveLocation } from '@/lib/actions';
import type { Location } from '@/lib/types';
import { Checkbox } from './ui/checkbox';
import LocationImporter from './LocationImporter';

interface LocationConfigProps {
  locations: Location[];
}

interface LocationRow {
    id: string;
    zone: string;
    section: string;
}

const locationFormSchema = z.object({
    id: z.string().optional(), // Holds original section name for edits
    zone: z.string().min(1, 'Zone is required'),
    section: z.string().min(1, 'Section is required'),
    isNewZone: z.boolean().default(false),
});
type LocationFormData = z.infer<typeof locationFormSchema>;

export default function LocationConfig({ locations: initialLocations }: LocationConfigProps) {
    const [locations, setLocations] = React.useState(initialLocations);
    const { toast } = useToast();
    const [sorting, setSorting] = React.useState<SortingState>([]);
    
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isImporterOpen, setIsImporterOpen] = React.useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
    const [selectedLocation, setSelectedLocation] = React.useState<LocationRow | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);
    
    const form = useForm<LocationFormData>({
        resolver: zodResolver(locationFormSchema),
        defaultValues: { zone: '', section: '', isNewZone: false },
    });

    const isNewZone = form.watch('isNewZone');

    const data = React.useMemo(() => {
        return locations.flatMap(loc => 
            loc.sections.map(sec => ({
                id: `${loc.zone}-${sec}`,
                zone: loc.zone,
                section: sec
            }))
        );
    }, [locations]);

    const refetchData = async () => {
      const refreshedLocations = await getLocations();
      setLocations(refreshedLocations);
    }

    const handleAddNew = () => {
        setSelectedLocation(null);
        form.reset({ zone: '', section: '', isNewZone: false });
        setIsFormOpen(true);
    };
    
    const handleEdit = (location: LocationRow) => {
        setSelectedLocation(location);
        form.reset({ id: location.section, zone: location.zone, section: location.section, isNewZone: false });
        setIsFormOpen(true);
    };

    const handleDelete = (location: LocationRow) => {
        setSelectedLocation(location);
        setIsDeleteAlertOpen(true);
    };
    
    const handleImportFinished = async () => {
        setIsImporterOpen(false);
        await refetchData();
    }


    const confirmDelete = async () => {
        if (selectedLocation) {
            const result = await deleteLocation(selectedLocation.zone, selectedLocation.section);
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


    const columns: ColumnDef<LocationRow>[] = [
        {
            accessorKey: 'zone',
            header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Zone <ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
        },
        {
            accessorKey: 'section',
            header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Section <ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
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
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: { sorting },
        initialState: { pagination: { pageSize: 10 } },
    });

  return (
    <>
        <div className='flex justify-end gap-2 py-4'>
            <Button onClick={() => setIsImporterOpen(true)} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import from CSV
            </Button>
            <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Location
            </Button>
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
                        {selectedLocation ? "Update the location details below." : "Add a new Section to an existing Zone, or create a new Zone."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        {!selectedLocation && (
                             <FormField
                                control={form.control}
                                name="isNewZone"
                                render={({ field }) => (
                                    <FormItem className='flex items-center gap-2'>
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        <FormLabel>Create a new Zone</FormLabel>
                                    </FormItem>
                                )}
                            />
                        )}
                       
                        <FormField control={form.control} name="zone" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Zone</FormLabel>
                                {isNewZone ? (
                                     <FormControl><Input placeholder="e.g. S6" {...field} /></FormControl>
                                ) : (
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!!selectedLocation}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a zone" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {locations.map(l => <SelectItem key={l.zone} value={l.zone}>{l.zone}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
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
                        This action cannot be undone. This will permanently delete the section <span className='font-bold'>{selectedLocation?.section}</span> from zone <span className='font-bold'>{selectedLocation?.zone}</span>. If this is the last section in the zone, the zone will also be deleted.
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
