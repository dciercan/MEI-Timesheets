import { Timer } from 'lucide-react';

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Timer className="h-7 w-7 text-primary" />
      <h1 className="text-xl font-bold font-headline text-primary">MEI Timesheet</h1>
    </div>
  );
}
