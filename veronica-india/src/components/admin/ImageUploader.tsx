"use client";

import { useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UploadCloud, X, Star, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

function SortableImage({
  url,
  index,
  onRemove,
}: {
  url: string;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: url,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group rounded-lg overflow-hidden border border-border bg-surface-dim aspect-square",
        isDragging && "opacity-60 z-10",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="w-full h-full object-contain p-1" />

      {index === 0 && (
        <span className="absolute top-1 left-1 flex items-center gap-0.5 bg-brand-orange text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
          <Star size={9} fill="currentColor" /> Primary
        </span>
      )}

      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute bottom-1 left-1 p-1 rounded bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-grab touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical size={12} />
      </button>

      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-danger transition-colors"
        aria-label="Remove image"
      >
        <X size={12} />
      </button>
    </div>
  );
}

export default function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(0);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    const valid: File[] = [];
    for (const f of list) {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name}: not an image`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name}: larger than 5MB`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length === 0) return;

    setUploading((n) => n + valid.length);
    const uploaded: string[] = [];
    for (const f of valid) {
      try {
        uploaded.push(await adminApi.uploadImage(f));
      } catch {
        toast.error(`Failed to upload ${f.name}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (uploaded.length) onChange([...value, ...uploaded]);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = value.indexOf(active.id as string);
    const to = value.indexOf(over.id as string);
    if (from !== -1 && to !== -1) onChange(arrayMove(value, from, to));
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        onPaste={(e) => {
          const imgs = Array.from(e.clipboardData.files).filter((f) =>
            f.type.startsWith("image/"),
          );
          if (imgs.length) handleFiles(imgs);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
          dragOver ? "border-brand-orange bg-brand-orange-light" : "border-border hover:border-brand-orange/50",
        )}
      >
        <UploadCloud className="mx-auto text-text-muted mb-2" size={26} />
        <p className="text-sm text-text-secondary font-medium">
          Drop, paste, or tap to upload
        </p>
        <p className="text-[11px] text-text-muted mt-0.5">PNG/JPG/WebP · up to 5MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {(value.length > 0 || uploading > 0) && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={value} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
              {value.map((url, i) => (
                <SortableImage
                  key={url}
                  url={url}
                  index={i}
                  onRemove={() => onChange(value.filter((u) => u !== url))}
                />
              ))}
              {Array.from({ length: uploading }).map((_, i) => (
                <div
                  key={`pending-${i}`}
                  className="aspect-square rounded-lg border border-border bg-surface-dim flex items-center justify-center"
                >
                  <Loader2 className="animate-spin text-text-muted" size={18} />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
