
"use client";
import TimesheetForm from "@/components/TimesheetForm";
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import ClientOnly from "@/components/ClientOnly";

export default function TimesheetPage() {
  return (
    <ClientOnly fallback={
      <div className="container mx-auto max-w-4xl py-8 px-4 md:px-6 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      </div>
    }>
      <TimesheetForm />
    </ClientOnly>
  );
}
