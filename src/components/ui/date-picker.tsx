
"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  selected: Date | undefined;
  onChange: (date: Date | undefined) => void;
  className?: string;
  dateFormat?: string;
  id?: string;
  placeholderText?: string; 
}

export function DatePicker({ selected, onChange, className, dateFormat = "PPP", id, placeholderText = "Pick a date" }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          id={id}
          className={cn(
            "w-full justify-center text-center font-normal date-picker-trigger-button", // Changed justify-start to justify-center and text-left to text-center
            !selected && "text-muted-foreground",
            className 
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, dateFormat) : <span>{placeholderText}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
