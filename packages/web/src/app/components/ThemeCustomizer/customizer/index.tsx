// React Imports
import { X, Settings as IconSettings } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// Component Imports
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from '@/components/ui/sheet';

import { SettingsProvider } from '../settingsContext';

import ThemeControlPanel from './ThemeControlPanel';

export function ThemeCustomizer() {
  // States
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sheetRef.current &&
        !sheetRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) document.addEventListener('mousedown', handleClickOutside);
    else document.removeEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <SettingsProvider>
      <Sheet open={open} onOpenChange={setOpen} modal={false}>
        {/* Trigger Button (FAB) */}
        <SheetTrigger asChild onClick={() => setOpen(true)}>
          <div
            className="cursor-pointer"
            aria-label="Theme customizer"
            data-tour="theme-customizer"
          >
            <IconSettings className="w-5 h-5" />
          </div>
        </SheetTrigger>
        <SheetContent className="h-full w-full gap-0 sm:max-w-100 [&>button]:hidden">
          <SheetHeader className="min-h-(--header-height) flex-row items-center justify-between border-b border-dashed px-6">
            <SheetTitle>Theme Customizer</SheetTitle>
            <SheetClose
              className="hover:bg-muted flex size-7 cursor-pointer items-center justify-center rounded transition-colors"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </SheetClose>
          </SheetHeader>
          <ThemeControlPanel />
        </SheetContent>
      </Sheet>
    </SettingsProvider>
  );
}
