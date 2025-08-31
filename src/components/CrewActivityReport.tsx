

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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUpDown } from 'lucide-react';
import type { CrewDocketWithDetails } from '@/lib/types';
import { format } from 'date-fns';

interface CrewActivityReportProps {
  dockets: CrewDocketWithDetails[];
}

export default function CrewActivityReport({ dockets }: CrewActivityReportProps) {
  const [sorting, setSorting] = React.useState<SortingState>([ { id: 'timesheetDate', desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const columns: ColumnDef<CrewDocketWithDetails>[] = [
    {
        accessorKey: 'id',
        header: 'Docket ID',
        cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('id')}</span>
    },
    {
        accessorKey: 'timesheetDate',
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                Date <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => format(new Date(row.getValue('timesheetDate')), 'dd/MM/yy')
    },
    { accessorKey: 'zone', header: 'Zone' },
    { accessorKey: 'section', header: 'Section' },
    { accessorKey: 'asset', header: 'Asset' },
    { accessorKey: 'subAsset', header: 'Sub-Asset' },
    { 
        accessorKey: 'activity.activity', 
        header: 'Activity',
        cell: ({ row }) => row.original.activity?.activity || 'N/A'
    },
    { 
        accessorKey: 'company', 
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                Company <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
    },
    { 
        accessorKey: 'submittedBy.fullName', 
        header: 'Supervisor',
        cell: ({ row }) => row.original.submittedBy?.fullName || 'N/A'
    },
    { 
        accessorKey: 'crewMembers', 
        header: 'Crew Size',
        cell: ({ row }) => row.original.crewMembers.length
    },
    { 
        accessorKey: 'productiveHours', 
        header: 'Productive Hours',
        cell: ({ row }) => row.original.timesheets[0]?.productiveHours || 0
    },
    {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => `${row.original.quantity} ${row.original.activity?.activityUom || ''}`.trim()
    },
    { 
        id: 'unproductiveHours',
        header: 'Unproductive Hours',
        cell: ({ row }) => {
            const totalUnproductiveMinutes = row.original.timesheets[0]?.unproductiveEntries?.reduce((total, entry) => total + entry.minutes, 0) || 0;
            const unproductiveHours = totalUnproductiveMinutes / 60;
            return unproductiveHours.toFixed(2);
        }
    },
    { 
        id: 'totalHours', 
        header: 'Total Hours',
        cell: ({ row }) => {
            const productiveHours = row.original.timesheets[0]?.productiveHours || 0;
            const totalUnproductiveMinutes = row.original.timesheets[0]?.unproductiveEntries?.reduce((total, entry) => total + entry.minutes, 0) || 0;
            const unproductiveHours = totalUnproductiveMinutes / 60;
            const totalHours = productiveHours + unproductiveHours;
            return totalHours.toFixed(2);
        }
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
    initialState: { pagination: { pageSize: 20 } },
    state: { sorting, columnFilters },
  });

  return (
    <>
        <div className="flex items-center gap-4 py-4">
            <Input
                placeholder="Filter by supervisor..."
                value={(table.getColumn('submittedBy_fullName')?.getFilterValue() as string) ?? ''}
                onChange={(event) => table.getColumn('submittedBy_fullName')?.setFilterValue(event.target.value)}
                className="max-w-sm"
            />
             <Input
                placeholder="Filter by activity..."
                value={(table.getColumn('activity_activity')?.getFilterValue() as string) ?? ''}
                onChange={(event) => table.getColumn('activity_activity')?.setFilterValue(event.target.value)}
                className="max-w-sm"
            />
              <Input
                placeholder="Filter by company..."
                value={(table.getColumn('company')?.getFilterValue() as string) ?? ''}
                onChange={(event) => table.getColumn('company')?.setFilterValue(event.target.value)}
                className="max-w-sm"
            />
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
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
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
        <div className="flex items-center justify-end space-x-2 py-4">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                Next
            </Button>
        </div>
    </>
  );
}
