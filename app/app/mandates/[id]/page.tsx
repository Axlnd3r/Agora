import { MandateList } from "../../../../components/mandate-list";

export default async function MandateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MandateList detailId={id} />;
}
