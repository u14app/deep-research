import { Search, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/style";

type Props = {
  className?: string;
  value?: string;
  onChange: (value: string) => void;
  onClear?: () => void;
};

function SearchArea({ className, value = "", onChange, onClear }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState<string>(value);
  const handleSubmit = () => {
    onChange(query);
  };
  const handleClear = () => {
    setQuery("");
    if (onClear) onClear();
  };

  return (
    <form
      className={cn("w-72 max-sm:w-full", className)}
      onSubmit={(ev) => {
        ev.preventDefault();
        handleSubmit();
      }}
    >
      <div className="flex gap-2">
        <div className="relative w-full">
          <Input
            name="query"
            className="pr-12 pl-2.5 text-sm"
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
          />
          {query !== "" ? (
            <X
              className="absolute right-8 top-2 p-1 h-5 w-5 hover:bg-gray-100 rounded-full transition-all text-muted-foreground cursor-pointer"
              onClick={() => handleClear()}
            />
          ) : null}
          <Button
            className="absolute right-1 top-1 h-7 w-7 rounded-full text-muted-foreground"
            title="Search"
            type="submit"
            variant="ghost"
            size="icon"
          >
            <Search />
          </Button>
        </div>
      </div>
    </form>
  );
}

export default SearchArea;
