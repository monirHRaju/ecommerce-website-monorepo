"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

interface Props {
  value?: string;          // current URL (shown as preview)
  onChange: (url: string) => void;
  folder?: string;         // cloudinary subfolder, default "deshio-admin"
  aspectRatio?: "square" | "wide"; // preview shape
  label?: string;
}

export default function ImageUpload({
  value,
  onChange,
  folder = "deshio-admin",
  aspectRatio = "wide",
  label,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      setProgress(0);

      // Fake incremental progress (real progress needs XHR, not fetch)
      const timer = setInterval(() => {
        setProgress((p) => (p < 85 ? p + 10 : p));
      }, 200);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error ?? "Upload failed");
        }

        setProgress(100);
        onChange(json.url);
        toast.success("Image uploaded");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        clearInterval(timer);
        setUploading(false);
        setProgress(0);
      }
    },
    [folder, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif"] },
    maxSize: 5 * 1024 * 1024, // 5 MB
    multiple: false,
    disabled: uploading,
    onDropAccepted: (files) => upload(files[0]),
    onDropRejected: (rejections) => {
      const reason = rejections[0]?.errors[0]?.message ?? "File rejected";
      toast.error(reason);
    },
  });

  const heightClass = aspectRatio === "square" ? "h-32" : "h-36";

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
      )}

      {/* dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative ${heightClass} rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden
          ${isDragActive
            ? "border-brand-400 bg-brand-50 dark:bg-brand-500/10"
            : "border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 bg-gray-50 dark:bg-gray-900"
          }
          ${uploading ? "pointer-events-none" : ""}
        `}
      >
        <input {...getInputProps()} />

        {/* current image preview */}
        {value && !uploading && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            {/* overlay hint on hover */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center transition-colors group">
              <div className="opacity-0 group-hover:opacity-100 flex flex-col items-center gap-1 text-white transition-opacity">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span className="text-xs font-medium">Replace image</span>
              </div>
            </div>
          </>
        )}

        {/* upload progress bar */}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90 gap-3">
            <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <div className="w-3/4 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Uploading…</p>
          </div>
        )}

        {/* empty state */}
        {!value && !uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <div className="text-center">
              <p className="text-xs font-medium">
                {isDragActive ? "Drop to upload" : "Click or drag & drop"}
              </p>
              <p className="text-xs mt-0.5">JPG, PNG, WebP — max 5 MB</p>
            </div>
          </div>
        )}
      </div>

      {/* URL display */}
      {value && (
        <p className="text-xs text-gray-400 truncate font-mono" title={value}>
          {value}
        </p>
      )}
    </div>
  );
}
