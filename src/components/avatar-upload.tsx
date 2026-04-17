"use client";

import { useRef, useState, useTransition } from "react";
import { updateAvatarAction } from "@/actions/profile";
import { Camera, Loader2 } from "lucide-react";

interface AvatarUploadProps {
  src: string;
  alt: string;
  size?: number;
}

export function AvatarUpload({ src, alt, size = 80 }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleClick() {
    inputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Client-side validation
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      setError("Use JPG, PNG, GIF, or WebP");
      return;
    }
    if (file.size > 500 * 1024) {
      setError("Max 500KB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("avatar", file);

    startTransition(async () => {
      const result = await updateAvatarAction(formData);
      if (result.error) {
        setError(result.error);
        setPreview(null);
      } else {
        setPreview(null);
      }
    });

    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  const imgSrc = preview || src;

  return (
    <div className="relative group inline-block">
      <img
        src={imgSrc}
        alt={alt}
        className="rounded-full shadow-xl shadow-primary/20 ring-4 ring-primary/20 object-cover transition-all duration-300"
        style={{ width: size, height: size }}
      />

      {/* Overlay on hover */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-200 cursor-pointer disabled:cursor-wait"
        title="Change avatar"
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 text-white animate-spin opacity-0 group-hover:opacity-100 transition-opacity" />
        ) : (
          <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-danger font-medium bg-card border border-danger/30 rounded px-2 py-0.5">
          {error}
        </div>
      )}
    </div>
  );
}
