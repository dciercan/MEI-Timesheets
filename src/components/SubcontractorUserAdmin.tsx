
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MoreHorizontal, PlusCircle, ArrowUpDown, Trash2, Edit, Loader2 } from 'lucide-react';
import type { User } from '@/lib/types';
import { saveUser, deleteUser, getUsers } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';

const userFormSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(1, 'Full name is required.'),
  company: z.string().min(1, 'Company is required.'),
  appRole: z.enum(['Crew Member', 'Crew Supervisor']),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserAdminProps {
    initialUsers: User[];
    currentUser: User;
}

export default function SubcontractorUserAdmin({ initialUsers, currentUser }: UserAdminProps) {
  const [users, setUsers] = React.useState(initialUsers);
  const [isSaving, setIsSaving] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const { toast } = useToast();

  const refetchUsers = React.useCallback(async () => {
    const updatedUsers = await getUsers(currentUser);
    setUsers(updatedUsers);
  }, [currentUser]);

  const handleAddNew = () => {
    setSelectedUser(null);
    form.reset({ 
        fullName: '', 
        company: currentUser.company, 
        appRole: 'Crew Member' 
    });
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    form.reset(user);
    setIsFormOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedUser) {
      const result = await deleteUser(selectedUser.id);
      if (result.success) {
        toast({ title: 'User deleted successfully.' });
        await refetchUsers();
      } else {
        toast({ variant: 'destructive', title: 'Error deleting user.' });
      }
      setIsDeleteAlertOpen(false);
      setSelectedUser(null);
    }
  };

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      fullName: '',
      company: currentUser.company,
      appRole: 'Crew Member',
    },
  });

  const onSubmit = async (data: UserFormData) => {
    setIsSaving(true);
    const formData = new FormData();
    if (selectedUser?.id) formData.append('id', selectedUser.id);
    formData.append('fullName', data.fullName);
    formData.append('company', data.company);
    formData.append('appRole', data.appRole);

    const result = await saveUser(formData);

    if (result.success) {
      toast({ title: `User ${selectedUser?.id ? 'updated' : 'added'} successfully.` });
      setIsFormOpen(false);
      await refetchUsers();
    } else {
      toast({ variant: 'destructive', title: 'Error saving user.' });
    }
    setIsSaving(false);
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'fullName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Full Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: 'company',
      header: 'Company',
    },
    {
      accessorKey: 'appRole',
      header: 'App Role',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        // Sub-admins cannot edit themselves
        if (user.id === currentUser.id) return null;
        
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
                <DropdownMenuItem onClick={() => handleEdit(user)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(user)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: users,
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
    <Card className="shadow-lg">
    <CardHeader className="flex flex-row items-center justify-between">
      <div>
        <CardTitle className="font-headline text-3xl">User Administration</CardTitle>
        <CardDescription>Manage users for {currentUser.company}.</CardDescription>
      </div>
      <Button onClick={handleAddNew}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add New User
      </Button>
    </CardHeader>
    <CardContent>
        <div className="flex items-center gap-4 py-4">
            <Input
            placeholder="Filter by name..."
            value={(table.getColumn('fullName')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
                table.getColumn('fullName')?.setFilterValue(event.target.value)
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

        {/* User Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                <DialogDescription>
                    {selectedUser ? "Update the user's details below." : "Enter details for the new user."}
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                        <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                        <Input {...field} disabled={true} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="appRole"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>App Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Crew Member">Crew Member</SelectItem>
                            <SelectItem value="Crew Supervisor">Crew Supervisor</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
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
                This action cannot be undone. This will permanently delete the user <span className='font-bold'>{selectedUser?.fullName}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </CardContent>
    </Card>
  );
}

    

    