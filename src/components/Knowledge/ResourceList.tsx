"use client";
import { Loader2, X } from "lucide-react";
import { isFunction } from "radash";
import { useState } from "react";
import Resource from "@/components/Knowledge/Resource";
import { formatSize } from "@/utils/file";
import { cn } from "@/utils/style";
import ResourceIcon from "./ResourceIcon";

type Props = {
  className?: string;
  resources: Resource[];
  onRemove?: (id: string) => void;
};

function ResourceList({ className, resources, onRemove }: Props) {
  const [openResource, setOpenResource] = useState<boolean>(false);
  const [resourceId, setResourceId] = useState<string>("");

  function handleOpenResource(id: string) {
    setResourceId(id);
    setOpenResource(true);
  }

  return (
    <div
      className={cn(
        className,
        "grid w-full grid-cols-3 flex-wrap gap-2 max-md:grid-cols-2 max-sm:max-h-60 overflow-y-auto max-md:gap-1"
      )}
    >
      {resources.map((resource) => {
        return (
          <div
            key={resource.id}
            className={cn(
              "flex rounded-md border p-1.5 text-left cursor-pointer hover:border-slate-400 transition-all",
              resource.status === "failed" ? "border-red-500 text-red-500" : ""
            )}
            onClick={() => handleOpenResource(resource.id)}
          >
            <div className="relative flex items-center mr-1.5 h-14 w-12 max-md:w-10 max-sm:w-8">
              <ResourceIcon
                className="p-1 h-12 w-12 max-md:m-0 max-md:w-10 max-md:h-10 max-sm:w-8 max-sm:h-8 max-sm:p-0"
                type={resource.type}
              />
              {resource.status === "processing" ? (
                <Loader2 className="absolute top-1/2 left-1/2 -ml-3 -mt-3 h-6 w-6 animate-spin text-blue-600" />
              ) : null}
            </div>
            <div className="flex h-14 w-3/4 flex-auto text-sm">
              <div className="flex-1 py-1">
                <h4
                  className="text-line-clamp-2 break-all font-medium leading-4"
                  title={resource.name}
                >
                  {resource.name}
                </h4>
                <p className="text-xs">{formatSize(resource.size)}</p>
              </div>
              {isFunction(onRemove) ? (
                <X
                  className="relative -top-0.5 opacity-50 -right-0.5 h-5 w-5 p-0.5 cursor-pointer rounded-full hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onRemove(resource.id);
                  }}
                />
              ) : null}
            </div>
          </div>
        );
      })}
      {resourceId ? (
        <Resource
          id={resourceId}
          open={openResource}
          onClose={() => setOpenResource(false)}
        ></Resource>
      ) : null}
    </div>
  );
}

export default ResourceList;
