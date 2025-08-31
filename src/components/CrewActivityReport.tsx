

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
import type { TimesheetSubmissionWithDetails } from '@/lib/types';
import { format } from 'date-fns';

type CrewSummary = {
    submissionCrewId: string;
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
  submissions: TimesheetSubmissionWithDetails[];
}

export default function CrewActivityReport({ submissions }: CrewActivityReportProps) {
  const [sorting, setSorting] = React.useState<SortingState>([ { id: 'timesheetDate', desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const crewSummaries = React.useMemo(() => {
    const crews: Record<string, {
        entries: TimesheetSubmissionWithDetails[],
        representative: TimesheetSubmissionWithDetails | null,
    }> = {};

    submissions.forEach(s => {
      const crewId = s.submissionCrewId || `individual-${s.id}`;
      if (!crews[crewId]) {
        crews[crewId] = { entries: [], representative: s };
      }
      crews[crewId].entries.push(s);
    });
    
    return Object.entries(crews).map(([crewId, crew]): CrewSummary => {
        const representative = crew.representative!;
        const totalUnproductiveMinutes = representative.unproductiveEntries?.reduce((total, entry) => total + entry.minutes, 0) || 0;
        const unproductiveHours = totalUnproductiveMinutes / 60;
        const totalHours = representative.productiveHours + unproductiveHours;

        return {
            submissionCrewId: crewId,
            timesheetDate: representative.timesheetDate,
            zone: representative.zone || 'N/A',
            section: representative.section || 'N/A',
            asset: representative.asset,
            subAsset: representative.subAsset,
            activity: representative.activity?.activity || 'N/A',
            company: representative.submittedBy?.company || 'N/A',
            supervisor: representative.submittedBy?.fullName || 'N/A',
            crewSize: crew.entries.length,
            productiveHours: representative.productiveHours,
            quantity: representative.quantity,
            quantityUom: representative.activity?.activityUom || '',
            unproductiveHours: unproductiveHours,
            totalHours: totalHours
        }
    })
  }, [submissions]);


  const columns: ColumnDef<CrewSummary>[] = [
    {
        accessorKey: 'submissionCrewId',
        header: 'Crew ID',
        cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('submissionCrewId')}</span>
    },
    {
        accessorKey: 'timesheetDate',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
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
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Company
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
    },
    { 
        accessorKey: 'supervisor', 
        header: 'Supervisor'
    },
    { accessorKey: 'crewSize', header: 'Crew Size' },
    { accessorKey: 'productiveHours', header: 'Productive Hours' },
    {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => `${row.original.quantity} ${row.original.quantityUom}`.trim()
    },
    { accessorKey: 'quantityUom', header: 'UoM' },
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
    initialState: {
        pagination: { pageSize: 20 },
        columnVisibility: { quantityUom: false } // Hide UoM by default as it's in Quantity
    },
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <>
        <div className="flex items-center gap-4 py-4">
            <Input
                placeholder="Filter by supervisor..."
                value={(table.getColumn('supervisor')?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                    table.getColumn('supervisor')?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
            />
             <Input
                placeholder="Filter by activity..."
                value={(table.getColumn('activity')?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                    table.getColumn('activity')?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
            />
              <Input
                placeholder="Filter by company..."
                value={(table.getColumn('company')?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                    table.getColumn('company')?.setFilterValue(event.target.value)
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
                        <TableHead key={header.id}>
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
    </>
  );
}
