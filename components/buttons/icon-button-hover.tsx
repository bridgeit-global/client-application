import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface IconButtonProps extends ButtonProps {
  icon: LucideIcon;
  text: string | number;
}

const IconButtonHover = React.forwardRef<HTMLButtonElement, IconButtonProps>(({
  icon: Icon,
  text,
  className,
  ...props
}, ref) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button ref={ref} className={className} {...props}>
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

IconButtonHover.displayName = 'IconButtonHover';

export default IconButtonHover;
