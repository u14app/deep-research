"use client";
import {
  Baby,
  BookOpen,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  ChevronUp,
  GraduationCap,
  Languages,
  LoaderCircle,
  PersonStanding,
  School,
  ScrollText,
  SlidersVertical,
  Swords,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Internal/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useArtifact from "@/hooks/useArtifact";

type Props = {
  value: string;
  systemInstruction?: string;
  onChange: (value: string) => void;
  buttonClassName?: string;
  dropdownMenuSide?: "top" | "right" | "bottom" | "left";
  dropdownMenuSideOffset?: number;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  tooltipSideOffset?: number;
};

function Artifact(props: Props) {
  const {
    value,
    onChange,
    systemInstruction,
    buttonClassName,
    dropdownMenuSide = "left",
    dropdownMenuSideOffset = 0,
    tooltipSide = "left",
    tooltipSideOffset = 0,
  } = props;
  const { t } = useTranslation();
  const { loadingAction, translate, changeReadingLevel, adjustLength, continuation } = useArtifact({
    value,
    onChange,
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className={buttonClassName}
            type="button"
            size="icon"
            variant="ghost"
            title={t("artifact.readingLevel")}
            side={tooltipSide}
            sideoffset={tooltipSideOffset}
            disabled={loadingAction !== ""}
          >
            {loadingAction === "readingLevel" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <BookOpen />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side={dropdownMenuSide} sideOffset={dropdownMenuSideOffset}>
          <DropdownMenuItem onClick={() => changeReadingLevel("PhD student", systemInstruction)}>
            <GraduationCap />
            <span>{t("artifact.PhD")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => changeReadingLevel("college student", systemInstruction)}
          >
            <School />
            <span>{t("artifact.college")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => changeReadingLevel("high school student", systemInstruction)}
          >
            <PersonStanding />
            <span>{t("artifact.teenager")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => changeReadingLevel("elementary school student", systemInstruction)}
          >
            <Baby />
            <span>{t("artifact.child")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => changeReadingLevel("pirate", systemInstruction)}>
            <Swords />
            <span>{t("artifact.pirate")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className={buttonClassName}
            type="button"
            size="icon"
            variant="ghost"
            title={t("artifact.adjustLength")}
            side={tooltipSide}
            sideoffset={tooltipSideOffset}
            disabled={loadingAction !== ""}
          >
            {loadingAction === "adjustLength" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <SlidersVertical />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side={dropdownMenuSide} sideOffset={dropdownMenuSideOffset}>
          <DropdownMenuItem
            onClick={() => adjustLength("much longer than it currently is", systemInstruction)}
          >
            <ChevronsUp />
            <span>{t("artifact.longest")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => adjustLength("slightly longer than it currently is", systemInstruction)}
          >
            <ChevronUp />
            <span>{t("artifact.long")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => adjustLength("slightly shorter than it currently is", systemInstruction)}
          >
            <ChevronDown />
            <span>{t("artifact.shorter")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => adjustLength("much shorter than it currently is", systemInstruction)}
          >
            <ChevronsDown />
            <span>{t("artifact.shortest")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className={buttonClassName}
            type="button"
            size="icon"
            variant="ghost"
            title={t("artifact.translate")}
            side={tooltipSide}
            sideoffset={tooltipSideOffset}
            disabled={loadingAction !== ""}
          >
            {loadingAction === "translate" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Languages />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side={dropdownMenuSide} sideOffset={dropdownMenuSideOffset}>
          <DropdownMenuItem onClick={() => translate("English", systemInstruction)}>
            <span>🇬🇧</span>
            <span>English</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => translate("Simplified Chinese", systemInstruction)}>
            <span>🇨🇳</span>
            <span>简体中文</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => translate("Traditional Chinese", systemInstruction)}>
            <span>🇭🇰</span>
            <span>繁体中文</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => translate("Japanese", systemInstruction)}>
            <span>🇯🇵</span>
            <span>日本語</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => translate("Korean", systemInstruction)}>
            <span>🇰🇷</span>
            <span>한국어</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => translate("Spanish", systemInstruction)}>
            <span>🇪🇸</span>
            <span>Español</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => translate("German", systemInstruction)}>
            <span>🇩🇪</span>
            <span>Deutsch</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => translate("French", systemInstruction)}>
            <span>🇫🇷</span>
            <span>Français</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => translate("Portuguese", systemInstruction)}>
            <span>🇧🇷</span>
            <span>Português</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => translate("Russian", systemInstruction)}>
            <span>🇷🇺</span>
            <span>Русский</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => translate("Hindi", systemInstruction)}>
            <span>🇮🇳</span>
            <span>हिन्दी</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => translate("Arabic", systemInstruction)}>
            <span>🇸🇦</span>
            <span>العربية</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        className={buttonClassName}
        type="button"
        size="icon"
        variant="ghost"
        title={t("artifact.continuation")}
        side={tooltipSide}
        sideoffset={tooltipSideOffset}
        disabled={loadingAction !== ""}
        onClick={() => continuation(systemInstruction)}
      >
        {loadingAction === "continuation" ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <ScrollText />
        )}
      </Button>
    </>
  );
}

export default Artifact;
