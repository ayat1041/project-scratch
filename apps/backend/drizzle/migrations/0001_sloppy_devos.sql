CREATE TABLE "app_seo_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" varchar(500) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_seo_pages_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "app_seo_pages_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"title" varchar(255),
	"meta_description" text,
	"meta_keywords" text,
	"canonical_url" varchar(500),
	"og_title" varchar(255),
	"og_description" text,
	"og_image_url" varchar(1000),
	"noindex" boolean DEFAULT false NOT NULL,
	"nofollow" boolean DEFAULT false NOT NULL,
	"json_ld" jsonb,
	"created_by" uuid,
	"published_by" uuid,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_site_seo_settings_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_number" integer NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"title_template" varchar(255),
	"meta_description" text,
	"meta_keywords" text,
	"canonical_base_url" varchar(500),
	"og_title" varchar(255),
	"og_description" text,
	"og_image_url" varchar(1000),
	"og_type" varchar(50) DEFAULT 'website',
	"twitter_card" varchar(50),
	"twitter_handle" varchar(100),
	"favicon_url" varchar(1000),
	"google_site_verification" varchar(255),
	"bing_site_verification" varchar(255),
	"google_analytics_id" varchar(100),
	"organization_json_ld" jsonb,
	"robots_mode" varchar(20) DEFAULT 'structured' NOT NULL,
	"robots_rules" jsonb,
	"robots_raw_content" text,
	"sitemap_mode" varchar(20) DEFAULT 'structured' NOT NULL,
	"sitemap_custom_urls" jsonb,
	"sitemap_raw_content" text,
	"created_by" uuid,
	"published_by" uuid,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_seo_pages_versions" ADD CONSTRAINT "app_seo_pages_versions_page_id_app_seo_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."app_seo_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_seo_pages_versions" ADD CONSTRAINT "app_seo_pages_versions_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_seo_pages_versions" ADD CONSTRAINT "app_seo_pages_versions_published_by_app_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_site_seo_settings_versions" ADD CONSTRAINT "app_site_seo_settings_versions_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_site_seo_settings_versions" ADD CONSTRAINT "app_site_seo_settings_versions_published_by_app_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_seo_pages_versions_one_published_per_page" ON "app_seo_pages_versions" USING btree ("page_id") WHERE "app_seo_pages_versions"."status" = 'published';--> statement-breakpoint
CREATE UNIQUE INDEX "idx_site_seo_settings_one_published" ON "app_site_seo_settings_versions" USING btree ("status") WHERE "app_site_seo_settings_versions"."status" = 'published';