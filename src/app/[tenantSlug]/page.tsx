// src/app/[tenantSlug]/page.tsx
import { getOrInitTenant } from "@/app/actions";
import StorefrontClient from "./StorefrontClient";

export const dynamic = "force-dynamic";

export default async function TenantStorePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getOrInitTenant(tenantSlug);

  return <StorefrontClient tenant={tenant} />;
}
