import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@/lib/language';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Languages } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguage: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
  compact?: boolean;
}

const LanguageSelector = ({ 
  selectedLanguage, 
  onLanguageChange,
  compact = false 
}: LanguageSelectorProps) => {
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage);
  
  return (
    <Select value={selectedLanguage} onValueChange={(value) => onLanguageChange(value as SupportedLanguage)}>
      <SelectTrigger 
        className={`glass border-glass-border ${
          compact 
            ? 'w-auto gap-2 px-3' 
            : 'w-full'
        }`}
      >
        <Languages className="w-4 h-4 text-primary" />
        <SelectValue>
          {compact ? currentLang?.nativeName : `${currentLang?.name} (${currentLang?.nativeName})`}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="glass border-glass-border bg-background/95 backdrop-blur-xl">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <SelectItem 
            key={lang.code} 
            value={lang.code}
            className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10"
          >
            <div className="flex items-center gap-3">
              <span className="font-medium">{lang.nativeName}</span>
              <span className="text-muted-foreground text-sm">({lang.name})</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
