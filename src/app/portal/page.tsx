import { getPublishedGalleries, getStudioByHost, requestHost } from "@/lib/public-studios";
import { StudioNotFound, StudioPortalView } from "@/app/studio/StudioPortalView";

export const dynamic = "force-dynamic";

export default async function HostPortalPage() {
  const host = await requestHost();
  const studio = await getStudioByHost(host);

  if (!studio) {
    return <StudioNotFound />;
  }

  const galleries = await getPublishedGalleries(studio.id);
  return <StudioPortalView studio={studio} galleries={galleries} />;
}
