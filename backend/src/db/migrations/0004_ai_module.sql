CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"weather_snapshot" jsonb NOT NULL,
	"satellite_snapshot" jsonb,
	"sensor_snapshot" jsonb,
	"prompt" text NOT NULL,
	"raw_response" text NOT NULL,
	"parsed_response" jsonb NOT NULL,
	"language" varchar(5) DEFAULT 'en' NOT NULL,
	"confidence" numeric(5, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recommendations_language_check" CHECK ("recommendations"."language" IN ('en', 'hi', 'mr')),
	CONSTRAINT "recommendations_confidence_check" CHECK ("recommendations"."confidence" >= 0 AND "recommendations"."confidence" <= 100)
);
--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "recommendations_farm_id_idx" ON "recommendations" USING btree ("farm_id");
--> statement-breakpoint
CREATE INDEX "recommendations_created_at_idx" ON "recommendations" USING btree ("created_at");
