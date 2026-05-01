"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  /** Optional caption / alt text. Falls back to empty alt for decorative use. */
  alt?: string;
  /** The full-resolution image URL — also used for the inline thumbnail. */
  src: string;
  /** Tailwind classes for the inline thumbnail wrapper (controls size). */
  thumbnailClassName?: string;
  /** Tailwind classes for the inline thumbnail <img>. */
  imgClassName?: string;
}

/**
 * Click-to-expand image viewer. The thumbnail uses object-contain to show the
 * full image rather than cropping. Click opens a centered <dialog> overlay
 * with the same image at natural size (capped to 90vw/90vh). ESC and
 * click-outside-the-image both close. Pointer hover fades to indicate
 * clickability without hiding the affordance.
 *
 * Native <dialog> = no library, accessible by default (focus trap, ESC).
 */
export default function ImageLightbox({
  alt = "",
  src,
  thumbnailClassName = "",
  imgClassName = "",
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  function openLightbox() {
    dialogRef.current?.showModal();
    setOpen(true);
  }
  function closeLightbox() {
    dialogRef.current?.close();
    setOpen(false);
  }

  // Click on the dialog backdrop (outside the image) closes. We detect this
  // by checking whether the click target is the <dialog> itself rather than
  // the <img> inside.
  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) closeLightbox();
  }

  // Keep React state in sync if the user closes via ESC (native dialog
  // behavior) so the parent can re-trigger if needed. Cleanup also force-closes
  // the dialog if it's still open at unmount — without this, a parent
  // re-render that drops this component (e.g., remove flow → router.refresh()
  // re-renders the gallery) leaves the modal/inert state stale at the document
  // level.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => setOpen(false);
    dialog.addEventListener("close", onClose);
    return () => {
      dialog.removeEventListener("close", onClose);
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={openLightbox}
        aria-label={alt ? `Open ${alt} full size` : "Open image full size"}
        className={`block group cursor-zoom-in transition-transform hover:scale-[1.02] focus-visible:scale-[1.02] focus-visible:outline-2 focus-visible:outline-brick ${thumbnailClassName}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`w-full h-full object-contain transition-opacity group-hover:opacity-90 ${imgClassName}`}
        />
      </button>

      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        className="bg-transparent p-0 m-auto max-w-[90vw] max-h-[90vh] backdrop:bg-base/90 backdrop:backdrop-blur-sm"
      >
        {open && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="max-w-[90vw] max-h-[90vh] object-contain"
            />
            <button
              type="button"
              onClick={closeLightbox}
              aria-label="Close image"
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-base/80 text-cream hover:bg-brick text-lg"
            >
              ✕
            </button>
          </>
        )}
      </dialog>
    </>
  );
}
