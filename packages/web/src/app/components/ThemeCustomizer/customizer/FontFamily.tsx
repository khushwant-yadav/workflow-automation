import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSettings } from "../hooks/useSettings";

const fonts = [
  { label: "Default", value: "'DM Sans', sans-serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
  { label: "Lato", value: "'Lato', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Nunito", value: "'Nunito', sans-serif" }
];

export default function FontFamilyPage() {
  const { settings, updateSettings } = useSettings();

  const currentFont =
    settings.theme.styles?.[settings.mode === 'system' ? 'light' : settings.mode]?.['font-sans'] ||
    fonts[0].value;

  const setFont = (fontValue: string) => {
    updateSettings({
      theme: {
        ...settings.theme,
        styles: {
          ...settings.theme.styles,
          light: { ...settings.theme.styles?.light, 'font-sans': fontValue },
          dark: { ...settings.theme.styles?.dark, 'font-sans': fontValue }
        }
      }
    });
  };

  return (
    <div className="p-2 space-y-4">
      <h2 className="text-base font-semibold">Choose Font Style</h2>
      <div className="grid gap-3">
        {fonts.map((f) => {
          const isActive = currentFont === f.value;
          return (
            <Card
              key={f.label}
              onClick={() => setFont(f.value)}
              className={cn(
                "p-3 cursor-pointer border transition-colors",
                isActive
                  ? "bg-primary/10 border-primary"
                  : "bg-muted hover:bg-muted/70"
              )}
            >
              <Label className="cursor-pointer" style={{ fontFamily: f.value }}>{f.label}</Label>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
