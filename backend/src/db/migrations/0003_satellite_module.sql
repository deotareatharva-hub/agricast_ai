CREATE TABLE "satellite_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"layer" varchar(30) NOT NULL,
	"params_hash" varchar(64) NOT NULL,
	"bbox" jsonb NOT NULL,
	"date_range" jsonb NOT NULL,
	"response_metadata" jsonb NOT NULL,
	"image_base64" text,
	"image_mime_type" varchar(50),
	"request_time" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "satellite_cache_layer_check" CHECK ("satellite_cache"."layer" IN ('TRUE_COLOR', 'FALSE_COLOR', 'NDVI', 'MOISTURE_INDEX', 'EVI'))
);
--> statement-breakpoint
CREATE TABLE "satellite_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"layer" varchar(30) NOT NULL,
	"bbox" jsonb NOT NULL,
	"date_range" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'success' NOT NULL,
	"response_metadata" jsonb,
	"error_message" text,
	"request_time" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "satellite_requests_status_check" CHECK ("satellite_requests"."status" IN ('success', 'error'))
);
--> statement-breakpoint
ALTER TABLE "satellite_cache" ADD CONSTRAINT "satellite_cache_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "satellite_requests" ADD CONSTRAINT "satellite_requests_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "satellite_requests" ADD CONSTRAINT "satellite_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "satellite_cache_farm_layer_params_unique" ON "satellite_cache" USING btree ("farm_id","layer","params_hash");
--> statement-breakpoint
CREATE INDEX "satellite_cache_expires_at_idx" ON "satellite_cache" USING btree ("expires_at");
--> statement-breakpoint
CREATE INDEX "satellite_requests_farm_id_idx" ON "satellite_requests" USING btree ("farm_id");
--> statement-breakpoint
CREATE INDEX "satellite_requests_user_id_idx" ON "satellite_requests" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "satellite_requests_request_time_idx" ON "satellite_requests" USING btree ("request_time");
