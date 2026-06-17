import { useState } from 'react';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface CollapsibleCardProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleCard({
  title,
  description,
  icon,
  headerAction,
  children,
  defaultOpen = false,
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="flex-1 text-left">
            <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-80 focus:outline-none">
              <div className="flex items-center gap-2 text-lg font-semibold">
                {icon}
                {title}
              </div>
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </CollapsibleTrigger>
            {description && <CardDescription className="mt-1">{description}</CardDescription>}
          </div>
          {headerAction && isOpen && <div className="ml-4">{headerAction}</div>}
        </CardHeader>
        <CollapsibleContent>
          <CardContent>{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
