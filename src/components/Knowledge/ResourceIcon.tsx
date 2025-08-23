"use client";
import { BookText, File, Link } from "lucide-react";
import { cn } from "@/utils/style";

type Props = {
  className?: string;
  type: string;
};

function ResourceIcon({ className, type }: Props) {
  if (type === "knowledge") {
    return <BookText className={className} />;
  } else if (type === "url") {
    return <Link className={cn("scale-90", className)} />;
  } else {
    return <File className={className} />;
  }
}

export default ResourceIcon;
