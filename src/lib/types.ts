export type GalleryStatus = "draft" | "published" | "archived";
export type WatermarkLayout = "center" | "tile";
export type OrderStatus = "pending" | "paid" | "expired" | "refunded";
export type ProfileRole = "platform_admin" | "photographer" | "assistant" | "admin" | "customer";

export type Studio = {
  id: string;
  name: string;
  public_name: string;
  slug: string;
  subdomain: string;
  custom_domain: string | null;
  logo_url: string | null;
  brand_color: string;
  client_intro: string;
  terms_url: string | null;
  refund_policy: string;
  gallery_published_email_enabled: boolean;
  stripe_payment_note: string;
  contact_email: string | null;
  default_branding_name: string;
  default_price_cents: number;
  default_full_gallery_price_cents: number | null;
  default_watermark_text: string;
  default_watermark_opacity: string;
  default_watermark_size: number;
  default_watermark_spacing: number;
  default_watermark_angle: number;
  default_watermark_layout: WatermarkLayout;
  default_download_limit: number;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  display_name: string;
  role: ProfileRole;
  branding_name: string;
  studio_id: string | null;
  studio_name?: string | null;
};

export type Gallery = {
  id: string;
  studio_id: string;
  owner_id: string;
  slug: string;
  title: string;
  customer_name: string;
  customer_email: string;
  expires_at: string | null;
  status: GalleryStatus;
  default_price_cents: number;
  full_gallery_price_cents: number | null;
  watermark_text: string;
  watermark_logo_key: string | null;
  watermark_opacity: string;
  watermark_size: number;
  watermark_spacing: number;
  watermark_angle: number;
  watermark_layout: WatermarkLayout;
  download_limit: number;
  photo_count?: string;
  paid_order_count?: string;
};

export type Photo = {
  id: string;
  studio_id: string;
  gallery_id: string;
  original_key: string;
  preview_key: string;
  filename: string;
  content_type: string;
  size_bytes: string;
  width: number | null;
  height: number | null;
  price_cents: number | null;
  sort_order: number;
};

export type Order = {
  id: string;
  studio_id: string;
  gallery_id: string;
  customer_email: string;
  stripe_checkout_session_id: string | null;
  status: OrderStatus;
  total_cents: number;
  currency: string;
  purchased_full_gallery: boolean;
  paid_at: string | null;
};
