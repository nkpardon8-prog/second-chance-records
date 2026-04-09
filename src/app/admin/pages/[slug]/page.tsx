import { getPageContent } from "@/lib/actions/content";
import ContentEditor from "@/components/admin/ContentEditor";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdminPageContentPage({ params }: PageProps) {
  const { slug } = await params;
  const sections = await getPageContent(slug);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Edit Page: {slug.charAt(0).toUpperCase() + slug.slice(1)}
      </h2>

      {sections.length === 0 ? (
        <p className="text-sm text-gray-500">No content sections found for this page.</p>
      ) : (
        <ContentEditor sections={sections} />
      )}
    </div>
  );
}
