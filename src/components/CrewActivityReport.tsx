

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

type CrewSummary = {
    docketId: string;
    timesheetDate: Date;
    zone: string;
    section: string;
    asset: string;
    subAsset: string;
    activity: string;
    company: string;
    supervisor: string;
    crewSize: number;
    productiveHours: number;
    quantity: number;
    quantityUom: string;
    unproductiveHours: number;
    totalHours: number;
}

interface CrewActivityReportProps {
  dockets: CrewDocketWithDetails[];
}

export default function CrewActivityReport({ dockets }: CrewActivityReportProps) {
  const [sorting, setSorting] = React.useState<SortingState>([ { id: 'timesheetDate', desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const crewSummaries = React.useMemo(() => {
    return dockets.map((docket): CrewSummary => {
        const representativeTimesheet = docket.timesheets[0] || { productiveHours: 0, unproductiveEntries: [] };
        const totalUnproductiveMinutes = representativeTimesheet.unproductiveEntries?.reduce((total, entry) => total + entry.minutes, 0) || 0;
        const unproductiveHours = totalUnproductiveMinutes / 60;
        const totalHours = representativeTimesheet.productiveHours + unproductiveHours;

        return {
            docketId: docket.id,
            timesheetDate: docket.timesheetDate,
            zone: docket.zone || 'N/A',
            section: docket.section || 'N/A',
            asset: docket.asset,
            subAsset: docket.subAsset,
            activity: docket.activity?.activity || 'N'A',
            company: docket.company,
            supervisor: docket.submittedBy?.fullName || 'N'A',
            crewSize: docket.crewMembers.length,
            productiveHours: representativeTimesheet.productiveHours,
            quantity: docket.quantity,
            quantityUom: docket.activity?.activityUom || '',
            unproductiveHours: unproductiveHours,
            totalHours: totalHours
        }
    })
  }, [dockets]);


  const columns: ColumnDef<CrewSummary>[] = [
    {
        accessorKey: 'docketId',
        header: 'Docket ID',
        cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('docketId')}</span>
    },
    {
        accessorKey: 'timesheetDate',
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                Date <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => format(new Date(row.getValue('timesheetDate')), 'PPP')
    },
    { accessorKey: 'zone', header: 'Zone' },
    { accessorKey: 'section', header: 'Section' },
    { accessorKey: 'asset', header: 'Asset' },
    { accessorKey: 'subAsset', header: 'Sub-Asset' },
    { accessorKey: 'activity', header: 'Activity' },
    { 
        accessorKey: 'company', 
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                Company <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
    },
    { accessorKey: 'supervisor', header: 'Supervisor' },
    { accessorKey: 'crewSize', header: 'Crew Size' },
    { accessorKey: 'productiveHours', header: 'Productive Hours' },
    {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => `${row.original.quantity} ${row.original.quantityUom}`.trim()
    },
    { 
        accessorKey: 'unproductiveHours', 
        header: 'Unproductive Hours',
        cell: ({ row }) => row.original.unproductiveHours.toFixed(2)
    },
    { 
        accessorKey: 'totalHours', 
        header: 'Total Hours',
        cell: ({ row }) => row.original.totalHours.toFixed(2)
    },
  ];

  const table = useReactTable({
    data: crewSummaries,
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
                value={(table.getColumn('supervisor')?.getFilterValue() as string) ?? ''}
                onChange={(event) => table.getColumn('supervisor')?.setFilterValue(event.target.value)}
                className="max-w-sm"
            />
             <Input
                placeholder="Filter by activity..."
                value={(table.getColumn('activity')?.getFilterValue() as string) ?? ''}
                onChange={(event) => table.getColumn('activity')?.setFilterValue(event.target.value)}
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
