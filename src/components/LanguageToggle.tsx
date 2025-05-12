import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { Globe } from "lucide-react";

export const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="h-8 w-8 text-sidebar-foreground"
    >
      <Globe className="h-5 w-5" />
      <span className="sr-only">
        {language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
      </span>
    </Button>
  );
};
