"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./dropdown-menu"
import { Button } from "./button"

type Props = {
  start: string
  end: string
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
  onApply?: () => void
  label?: React.ReactNode
}

export function DateRangePicker({
  start,
  end,
  onStartChange,
  onEndChange,
  onApply,
  label,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">
            {label ? label : `${start} — ${end}`}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 p-3">
        <div className="grid gap-2">
          <label className="text-xs text-muted-foreground">Start</label>
          <input
            type="date"
            value={start}
            onChange={(e) => onStartChange(e.target.value)}
            className={cn("rounded-md border px-2 py-1 text-sm")}
          />

          <label className="text-xs text-muted-foreground">End</label>
          <input
            type="date"
            value={end}
            onChange={(e) => onEndChange(e.target.value)}
            className={cn("rounded-md border px-2 py-1 text-sm")}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <DropdownMenuItem
              onSelect={() => {
                /* noop - selecting this will close the menu */
              }}
              className="px-0"
            >
              <span className="text-sm">Cancel</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={() => {
                onApply?.()
              }}
              className="px-0"
            >
              <span className="text-sm">Apply</span>
            </DropdownMenuItem>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DateRangePicker
