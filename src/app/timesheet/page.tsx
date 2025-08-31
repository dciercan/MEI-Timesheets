
"use client";
import TimesheetForm from "@/components/TimesheetForm";
import React from 'react';

export default function TimesheetPage() {
  return (
    <React.Suspense>
      <TimesheetForm />
    </React.Suspense>
  );
}
