import { keyFromImageUrl } from "@/lib/image-store";
import ImageLightbox from "@/components/ui/ImageLightbox";

const SWAG_IMAGE_KEY_PREFIX = "swag/";

interface Item {
  id: number;
  name: string;
  description: string | null;
  images: { id: number; url: string }[];
}

interface Props {
  items: Item[];
}

export default function SwagGrid({ items }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => {
        const safeImages = item.images.filter((img) => {
          const key = keyFromImageUrl(img.url);
          return key !== null && key.startsWith(SWAG_IMAGE_KEY_PREFIX);
        });

        return (
          <article
            key={item.id}
            className="bg-card border border-white/5 rounded-sm overflow-hidden"
          >
            {safeImages.length > 0 ? (
              <>
                <div className="relative aspect-square bg-base">
                  <ImageLightbox
                    src={safeImages[0].url}
                    alt={`${item.name} — photo 1 of ${safeImages.length}`}
                    thumbnailClassName="w-full h-full"
                    imgClassName=""
                  />
                </div>
                {safeImages.length > 1 && (
                  <div className="flex gap-1 p-2 overflow-x-auto">
                    {safeImages.slice(1).map((img, i) => (
                      <ImageLightbox
                        key={img.id}
                        src={img.url}
                        alt={`${item.name} — photo ${i + 2} of ${safeImages.length}`}
                        thumbnailClassName="w-12 h-12 flex-shrink-0"
                        imgClassName=""
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square bg-base/50 flex items-center justify-center text-kraft/50 text-sm font-mono">
                Photo coming soon
              </div>
            )}

            <div className="p-4">
              <h3 className="font-heading text-lg uppercase tracking-tight text-cream mb-1">
                {item.name}
              </h3>
              {item.description && (
                <p className="font-sans text-sm text-kraft/80 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
