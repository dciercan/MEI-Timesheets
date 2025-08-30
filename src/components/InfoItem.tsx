
import { Badge } from "@/components/ui/badge";

export default function InfoItem({ icon: Icon, label, value, badge }: { icon: React.ElementType, label: string, value?: string | number, badge?: string | null }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="flex items-start gap-3">
       <div className="p-2 bg-background rounded-full mt-1">
          <Icon className="h-4 w-4 text-muted-foreground" />
       </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2">
            <p className="font-semibold">{value}</p>
            {badge && <Badge variant="secondary">{badge}</Badge>}
        </div>
      </div>
    </div>
  )
}
