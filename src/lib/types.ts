export type GalleryStatus = "draft" | "published" | "archived";
export type WatermarkLayout = "center" | "tile";
export type OrderStatus = "pending" | "paid" | "expired" | "refunded";

export type Profile = {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "customer";
  branding_name: string;
};

export type Gallery = {
  id: string;
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
  gallery_id: string;
  customer_email: string;
  stripe_checkout_session_id: string | null;
  status: OrderStatus;
  total_cents: number;
  currency: string;
  purchased_full_gallery: boolean;
  paid_at: string | null;
};
