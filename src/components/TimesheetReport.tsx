
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
import type { TimesheetWithDetails } from '@/lib/types';
import { format } from 'date-fns';

interface TimesheetReportProps {
  timesheets: TimesheetWithDetails[];
}

export default function TimesheetReport({ timesheets }: TimesheetReportProps) {
  const [sorting, setSorting] = React.useState<SortingState>([ { id: 'timesheetDate', desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const columns: ColumnDef<TimesheetWithDetails>[] = [
    {
        accessorKey: 'id',
        header: 'Timesheet ID',
        cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('id')}</span>
    },
    {
        accessorKey: 'crewDocket.timesheetDate',
        id: 'timesheetDate',
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                Date <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => format(new Date(row.original.crewDocket.timesheetDate), 'PPP')
    },
    {
        accessorKey: 'crewMember.fullName',
        header: 'Crew Member',
    },
    {
        accessorKey: 'productiveHours',
        header: 'Productive Hours'
    },
    {
        id: 'unproductiveMinutes',
        header: 'Unproductive Minutes',
        cell: ({ row }) => row.original.unproductiveEntries?.reduce((acc, entry) => acc + entry.minutes, 0) || 0
    },
    {
        accessorKey: 'crewDocketId',
        header: 'Crew Docket ID',
        cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('crewDocketId')}</span>
    },
    {
        accessorKey: 'submittedBy.fullName',
        header: 'Supervisor'
    }
  ];

  const table = useReactTable({
    data: timesheets,
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
                placeholder="Filter by crew member..."
                value={(table.getColumn('crewMember_fullName')?.getFilterValue() as string) ?? ''}
                onChange={(event) => table.getColumn('crewMember_fullName')?.setFilterValue(event.target.value)}
                className="max-w-sm"
            />
             <Input
                placeholder="Filter by supervisor..."
                value={(table.getColumn('submittedBy_fullName')?.getFilterValue() as string) ?? ''}
                onChange={(event) => table.getColumn('submittedBy_fullName')?.setFilterValue(event.target.value)}
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
