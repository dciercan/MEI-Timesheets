

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
import { ArrowUpDown, Download } from 'lucide-react';
import type { CrewDocketWithDetails, CrewDocketStatus } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';

interface CrewActivityReportProps {
  dockets: CrewDocketWithDetails[];
}

export default function CrewActivityReport({ dockets }: CrewActivityReportProps) {
  const [sorting, setSorting] = React.useState<SortingState>([ { id: 'timesheetDate', desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const statusBadgeVariant = (status: CrewDocketStatus) => {
    switch (status) {
        case 'Submitted': return 'warning';
        case 'Approved': return 'default';
        case 'Rejected': return 'destructive';
        case 'Processed': return 'outline';
        default: return 'secondary';
    }
  }

  const columns: ColumnDef<CrewDocketWithDetails>[] = [
    {
        accessorKey: 'id',
        header: 'Docket ID',
    },
    {
        accessorKey: 'timesheetDate',
        header: 'Date',
        cell: ({ row }) => format(new Date(row.getValue('timesheetDate')), 'dd/MM/yy')
    },
    { 
        accessorKey: 'submittedBy.fullName', 
        header: 'Supervisor',
    },
    { 
        accessorKey: 'company', 
        header: 'Company',
    },
    { accessorKey: 'zone', header: 'Zone' },
    { accessorKey: 'section', header: 'Section' },
    { accessorKey: 'asset', header: 'Asset' },
    { accessorKey: 'subAsset', header: 'Sub-Asset' },
    { 
        accessorKey: 'activity.activity', 
        header: 'Activity',
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
        accessorKey: 'crewMembers', 
        header: 'Crew Size',
        cell: ({ row }) => row.original.crewMembers.length
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
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('status') as CrewDocketStatus;
            return <Badge variant={statusBadgeVariant(status)} className={cn(status === 'Approved' && 'bg-green-600')}>{status}</Badge>;
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

   const handleExport = () => {
    const dataToExport = table.getFilteredRowModel().rows.map(row => {
        const unproductiveMinutes = row.original.timesheets[0]?.unproductiveEntries?.reduce((total, entry) => total + entry.minutes, 0) || 0;
        return {
            'Docket ID': row.original.id,
            'Date': format(new Date(row.original.timesheetDate), 'dd/MM/yy'),
            'Supervisor': row.original.submittedBy?.fullName || 'N/A',
            'Company': row.original.company,
            'Zone': row.original.zone,
            'Section': row.original.section,
            'Asset': row.original.asset,
            'Sub-Asset': row.original.subAsset,
            'Activity': row.original.activity?.activity || 'N/A',
            'Productive Hours': row.original.timesheets[0]?.productiveHours || 0,
            'Quantity': `${row.original.quantity} ${row.original.activity?.activityUom || ''}`.trim(),
            'Crew Size': row.original.crewMembers.length,
            'Unproductive Hours': (unproductiveMinutes / 60).toFixed(2),
            'Status': row.original.status,
        }
    });

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'crew_activity_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <>
        <div className="flex items-center gap-4 py-4">
            <div className="flex-grow flex items-center gap-4">
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
            <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export to CSV
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
