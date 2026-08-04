alter table studios add column if not exists client_intro text not null default 'Choose your private proof gallery below.';
alter table studios add column if not exists terms_url text;
alter table studios add column if not exists refund_policy text not null default 'Digital photo orders are fulfilled immediately after payment and are reviewed case by case.';
alter table studios add column if not exists gallery_published_email_enabled boolean not null default true;
alter table studios add column if not exists stripe_payment_note text not null default 'Payments are processed securely through Stripe.';
