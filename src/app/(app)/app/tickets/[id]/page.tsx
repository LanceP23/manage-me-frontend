import Card from "@/shared/ui/Card";
import TicketDetailClient from "@/features/tickets/components/TicketDetailClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TicketDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6">
      <TicketDetailClient ticketId={id} />
      <Card eyebrow="Commits" title="Linked changes">
        <p className="text-[var(--mm-mist)]">
          Commit links will appear once they are attached to this ticket.
        </p>
      </Card>
    </div>
  );
}
