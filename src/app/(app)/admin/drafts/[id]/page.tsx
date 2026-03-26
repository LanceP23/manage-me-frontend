import DraftDetailClient from "@/features/drafts/components/DraftDetailClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DraftDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6">
      <DraftDetailClient draftId={id} />
    </div>
  );
}
