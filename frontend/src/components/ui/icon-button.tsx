'use client';

import * as React from 'react';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

type ButtonProps = React.ComponentProps<typeof Button>;

interface IconButtonProps extends ButtonProps {
  tooltip: string;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
}

export function IconButton({
  tooltip,
  tooltipSide = 'top',
  children,
  ...buttonProps
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button {...buttonProps} aria-label={buttonProps['aria-label'] ?? tooltip}>
            {children}
          </Button>
        }
      />
      <TooltipContent side={tooltipSide}>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
