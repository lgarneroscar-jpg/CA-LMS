import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, Circle, Lock } from "lucide-react";
import { getPillarLabel } from "@/lib/program";

type ModuleHeaderProps = {
  title: string;
  moduleCode: string;
  pillar: number;
  estimatedMinutes: number;
  isComplete: boolean;
  isLocked?: boolean;
};

export function ModuleHeader({
  title,
  moduleCode,
  pillar,
  estimatedMinutes,
  isComplete,
  isLocked,
}: ModuleHeaderProps) {
  return (
    <header className="space-y-4 border-b border-border pb-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="font-mono text-xs">
          {moduleCode}
        </Badge>
        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
          {getPillarLabel(pillar)}
        </Badge>
        {isLocked ? (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Lock className="size-3" />
            Locked
          </Badge>
        ) : isComplete ? (
          <Badge className="gap-1 bg-accent text-accent-foreground hover:bg-accent">
            <CheckCircle2 className="size-3" />
            Complete
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1">
            <Circle className="size-3" />
            In progress
          </Badge>
        )}
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="size-4" />
        ~{estimatedMinutes} min to complete
      </p>
    </header>
  );
}
