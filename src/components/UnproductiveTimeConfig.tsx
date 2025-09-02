

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
import type { UnproductiveReason } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from './ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { deleteUnproductiveReason, getUnproductiveReasons, saveUnproductiveReason } from '@/lib/actions';

interface UnproductiveTimeConfigProps {
  reasons: UnproductiveReason[];
}

const reasonFormSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, 'Code is required'),
  reason: z.string().min(1, 'Reason is required'),
  uom: z.string().min(1, 'UoM is required'),
});
type ReasonFormData = z.infer<typeof reasonFormSchema>;

export default function UnproductiveTimeConfig({ reasons: initialReasons }: UnproductiveTimeConfigProps) {
  const [reasons, setReasons] = React.useState(initialReasons);
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedReason, setSelectedReason] = React.useState<UnproductiveReason | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<ReasonFormData>({
    resolver: zodResolver(reasonFormSchema),
    defaultValues: { code: '', reason: '', uom: 'hours' },
  });

  const refetchData = async () => {
    const data = await getUnproductiveReasons();
    setReasons(data);
  }

  const handleAddNew = () => {
    setSelectedReason(null);
    form.reset({ code: '', reason: '', uom: 'hours' });
    setIsFormOpen(true);
  };
  
  const handleEdit = (reason: UnproductiveReason) => {
    setSelectedReason(reason);
    form.reset(reason);
    setIsFormOpen(true);
  };

  const handleDelete = (reason: UnproductiveReason) => {
    setSelectedReason(reason);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedReason) {
      const result = await deleteUnproductiveReason(selectedReason.id);
      if (result.success) {
        toast({ title: 'Reason deleted successfully.' });
        await refetchData();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
      setIsDeleteAlertOpen(false);
      setSelectedReason(null);
    }
  };

  const onSubmit = async (data: ReasonFormData) => {
    setIsSaving(true);
    const result = await saveUnproductiveReason(data);
    if (result.success) {
      toast({ title: `Reason ${data.id ? 'updated' : 'created'} successfully.` });
      await refetchData();
      setIsFormOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsSaving(false);
  };

  const columns: ColumnDef<UnproductiveReason>[] = [
    {
        accessorKey: 'code',
        header: 'Code',
    },
    {
        accessorKey: 'reason',
        header: 'Reason',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const reason = row.original;
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
                <DropdownMenuItem onClick={() => handleEdit(reason)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(reason)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: reasons,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className='flex justify-end py-4'>
        <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Reason
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
                  No results.
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
                    <DialogTitle>{selectedReason ? 'Edit Reason' : 'Add New Reason'}</DialogTitle>
                    <DialogDescription>
                        {selectedReason ? "Update the reason details below." : "Enter details for the new unproductive time reason."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="code" render={({ field }) => (
                            <FormItem><FormLabel>Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="reason" render={({ field }) => (
                            <FormItem><FormLabel>Reason</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="uom" render={({ field }) => (
                            <FormItem><FormLabel>UoM</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>
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
                    This action cannot be undone. This will permanently delete the reason: <span className='font-bold'>{selectedReason?.reason}</span>.
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
