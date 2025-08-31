

'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
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
import { MoreHorizontal, Edit, Trash2, PlusCircle, Loader2 } from 'lucide-react';
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
import { deleteLocation, getSections, getZones, saveLocation } from '@/lib/actions';

interface LocationConfigProps {
  zones: string[];
  sections: string[];
}

interface LocationRow {
    id: string;
    type: 'Zone' | 'Section';
    name: string;
}

const locationFormSchema = z.object({
    type: z.enum(['Zone', 'Section'], { required_error: 'Type is required' }),
    name: z.string().min(1, 'Name is required'),
    originalName: z.string().optional(),
});
type LocationFormData = z.infer<typeof locationFormSchema>;

export default function LocationConfig({ zones: initialZones, sections: initialSections }: LocationConfigProps) {
    const [zones, setZones] = React.useState(initialZones);
    const [sections, setSections] = React.useState(initialSections);
    const { toast } = useToast();
    
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
    const [selectedLocation, setSelectedLocation] = React.useState<LocationRow | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);
    
    const form = useForm<LocationFormData>({
        resolver: zodResolver(locationFormSchema),
        defaultValues: { type: 'Zone', name: '' },
    });

    const data = React.useMemo(() => {
        const zoneData: LocationRow[] = zones.map((z, i) => ({ id: `zone-${i}`, type: 'Zone', name: z }));
        const sectionData: LocationRow[] = sections.map((s, i) => ({ id: `section-${i}`, type: 'Section', name: s }));
        return [...zoneData, ...sectionData].sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
    }, [zones, sections]);

    const refetchData = async () => {
      const [refreshedZones, refreshedSections] = await Promise.all([getZones(), getSections()]);
      setZones(refreshedZones);
      setSections(refreshedSections);
    }

    const handleAddNew = () => {
        setSelectedLocation(null);
        form.reset({ type: 'Zone', name: '' });
        setIsFormOpen(true);
    };
    
    const handleEdit = (location: LocationRow) => {
        setSelectedLocation(location);
        form.reset({ type: location.type, name: location.name, originalName: location.name });
        setIsFormOpen(true);
    };

    const handleDelete = (location: LocationRow) => {
        setSelectedLocation(location);
        setIsDeleteAlertOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedLocation) {
            const result = await deleteLocation(selectedLocation.type, selectedLocation.name);
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
            toast({ title: `Location ${data.originalName ? 'updated' : 'created'} successfully.` });
            await refetchData();
            setIsFormOpen(false);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setIsSaving(false);
    };


    const columns: ColumnDef<LocationRow>[] = [
        {
            accessorKey: 'type',
            header: 'Type',
        },
        {
            accessorKey: 'name',
            header: 'Name',
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
    });

  return (
    <>
        <div className='flex justify-end py-4'>
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

        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{selectedLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
                    <DialogDescription>
                        {selectedLocation ? "Update the location details below." : "Enter details for the new Zone or Section."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="type" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Zone">Zone</SelectItem>
                                        <SelectItem value="Section">Section</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl><Input placeholder="e.g. S1 or M011" {...field} /></FormControl>
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
                    This action cannot be undone. This will permanently delete the {selectedLocation?.type}: <span className='font-bold'>{selectedLocation?.name}</span>.
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
