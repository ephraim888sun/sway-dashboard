"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import type { JurisdictionInfluence } from "@/types/dashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  IconChevronDown,
  IconChevronUp,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";

interface JurisdictionTableProps {
  data: JurisdictionInfluence[];
  isLoading?: boolean;
}

const columns: ColumnDef<JurisdictionInfluence>[] = [
  {
    accessorKey: "name",
    header: "Jurisdiction",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue("name")}</div>
        <div className="text-sm text-muted-foreground">
          {row.original.level || "Unknown level"}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "supporterCount",
    header: "Supporters",
    cell: ({ row }) => {
      const count = row.getValue("supporterCount") as number;
      return <div className="font-medium">{count.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "supporterShare",
    header: "Share of Turnout",
    cell: ({ row }) => {
      const share = row.getValue("supporterShare") as number | null;
      return (
        <div className="font-medium">
          {share !== null ? `${share.toFixed(2)}%` : "N/A"}
        </div>
      );
    },
  },
  {
    accessorKey: "activeRate",
    header: "Active Rate",
    cell: ({ row }) => {
      const rate = row.getValue("activeRate") as number;
      return <div className="font-medium">{rate.toFixed(1)}%</div>;
    },
  },
  {
    accessorKey: "growth30d",
    header: "30-Day Growth",
    cell: ({ row }) => {
      const growth = row.getValue("growth30d") as number;
      const isPositive = growth >= 0;
      return (
        <div
          className={`font-medium ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {isPositive ? "+" : ""}
          {growth.toFixed(1)}%
        </div>
      );
    },
  },
];

export function JurisdictionTable({ data, isLoading }: JurisdictionTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "supporterShare", desc: true },
  ]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jurisdiction</TableHead>
              <TableHead>Supporters</TableHead>
              <TableHead>Share of Turnout</TableHead>
              <TableHead>Active Rate</TableHead>
              <TableHead>30-Day Growth</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell colSpan={5} className="h-12">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "flex items-center gap-2 cursor-pointer select-none hover:text-foreground"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="ml-2">
                            {header.column.getIsSorted() === "asc" ? (
                              <IconChevronUp className="h-4 w-4" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <IconChevronDown className="h-4 w-4" />
                            ) : (
                              <IconChevronDown className="h-4 w-4 opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-muted-foreground">
                      No jurisdictions found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {data.length === 0
                        ? "No jurisdiction data available"
                        : "No jurisdictions match the current filters"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}{" "}
          to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          of {table.getFilteredRowModel().rows.length} jurisdictions
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
