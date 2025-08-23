"use client";
import { type ReactNode, useRef } from "react";

type Props = {
  children: ReactNode;
  accept?: string;
  onChange: (files: FileList | null) => void;
};

function UploadWrapper({ children, accept, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={(ev) => onChange(ev.target.files)}
      />
      <div onClick={() => handleClick()}>{children}</div>
    </>
  );
}

export default UploadWrapper;
