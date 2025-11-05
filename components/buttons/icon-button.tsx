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
  text?: string | number;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(({
  icon: Icon,
  text,
  className,
  ...props
}, ref) => {
  return (
    <Button ref={ref} className={className} {...props}>
      <Icon className={`h-4 w-4 ${text ? 'md:mr-2' : ''}`} />
      <p className="hidden md:block">{text}</p>
    </Button>
  );
});

IconButton.displayName = 'IconButton';

export default IconButton;
