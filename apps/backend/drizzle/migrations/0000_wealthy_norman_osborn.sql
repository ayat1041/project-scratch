CREATE TABLE "app_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" varchar(255) NOT NULL,
	"operation_type" varchar(20) NOT NULL,
	"user_id" uuid NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"changed_fields" jsonb,
	"source" text,
	"description" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"state_id" uuid NOT NULL,
	"country_id" uuid NOT NULL,
	"latitude" numeric(10, 6),
	"longitude" numeric(10, 6),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app_countries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"iso3" varchar(3) NOT NULL,
	"iso2" varchar(2) NOT NULL,
	"phone_code" varchar(20),
	"capital" varchar(100),
	"currency" varchar(50),
	"region" varchar(100),
	"subregion" varchar(100),
	"latitude" numeric(10, 6),
	"longitude" numeric(10, 6),
	"emoji" varchar(10),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "app_countries_iso3_unique" UNIQUE("iso3"),
	CONSTRAINT "app_countries_iso2_unique" UNIQUE("iso2")
);
--> statement-breakpoint
CREATE TABLE "app_email_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"role" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_email_verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "app_languages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app_permission_to_roles" (
	"permission_id" integer,
	"role_id" integer,
	CONSTRAINT "app_permission_to_roles_permission_id_role_id_unique" UNIQUE("permission_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "app_permissions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "app_permissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(91) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "app_roles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "app_roles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(91) NOT NULL,
	"description" text,
	"scope" varchar(50) DEFAULT 'platform' NOT NULL,
	"is_system_role" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "app_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"country_id" uuid NOT NULL,
	"latitude" numeric(10, 6),
	"longitude" numeric(10, 6),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app_timezones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"utc_offset" varchar(10) NOT NULL,
	"label" varchar(150) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "app_timezones_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "app_user_refresh_tokens" (
	"jti" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"family_id" uuid NOT NULL,
	"rotated_to" uuid,
	"revoked_at" timestamp with time zone,
	"expires_at" timestamp NOT NULL,
	"deviceInfo" text NOT NULL,
	"ip" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "app_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(64) NOT NULL,
	"isVerified" boolean DEFAULT false NOT NULL,
	"isDeleted" boolean DEFAULT false NOT NULL,
	"registered_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"provider_name" varchar(90) DEFAULT 'email' NOT NULL,
	"user_origin" varchar(50) DEFAULT 'self_registered' NOT NULL,
	"invited_by" uuid,
	"username" varchar(150) NOT NULL,
	"username_updated_at" timestamp,
	"profile_image" varchar(500),
	CONSTRAINT "app_users_email_unique" UNIQUE("email"),
	CONSTRAINT "app_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "app_activity_logs" ADD CONSTRAINT "app_activity_logs_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_cities" ADD CONSTRAINT "app_cities_state_id_app_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."app_states"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_cities" ADD CONSTRAINT "app_cities_country_id_app_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."app_countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_email_verification_tokens" ADD CONSTRAINT "app_email_verification_tokens_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_permission_to_roles" ADD CONSTRAINT "app_permission_to_roles_permission_id_app_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."app_permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_permission_to_roles" ADD CONSTRAINT "app_permission_to_roles_role_id_app_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."app_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_states" ADD CONSTRAINT "app_states_country_id_app_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."app_countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_user_refresh_tokens" ADD CONSTRAINT "app_user_refresh_tokens_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_user_roles" ADD CONSTRAINT "app_user_roles_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_user_roles" ADD CONSTRAINT "app_user_roles_role_id_app_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."app_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_city_name_state" ON "app_cities" USING btree ("name","state_id");--> statement-breakpoint
CREATE INDEX "idx_cities_state_id" ON "app_cities" USING btree ("state_id");--> statement-breakpoint
CREATE INDEX "idx_cities_country_id" ON "app_cities" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "idx_email_verification_tokens_user_id" ON "app_email_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_email_verification_tokens_expires_at" ON "app_email_verification_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_email_verification_tokens_user_role" ON "app_email_verification_tokens" USING btree ("user_id","role");--> statement-breakpoint
CREATE INDEX "idx_languages_name_search" ON "app_languages" USING btree (LOWER("name"));--> statement-breakpoint
CREATE INDEX "idx_permission_roles_role_id" ON "app_permission_to_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_permission_roles_permission_id" ON "app_permission_to_roles" USING btree ("permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_state_name_country" ON "app_states" USING btree ("name","country_id");--> statement-breakpoint
CREATE INDEX "idx_states_country_id" ON "app_states" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "idx_timezones_name" ON "app_timezones" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_user_refresh_tokens_user_id" ON "app_user_refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_refresh_tokens_family_id" ON "app_user_refresh_tokens" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "idx_user_refresh_tokens_expires_at" ON "app_user_refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_user_refresh_tokens_user_expires" ON "app_user_refresh_tokens" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "idx_user_roles_user_id" ON "app_user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_role_id" ON "app_user_roles" USING btree ("role_id");