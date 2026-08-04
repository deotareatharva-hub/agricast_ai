CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"generated_by" uuid NOT NULL,
	"report_type" varchar(30) NOT NULL,
	"file_type" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"download_url" text,
	"metadata" jsonb NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reports_report_type_check" CHECK ("reports"."report_type" IN ('today', 'weekly', 'monthly', 'recommendation')),
	CONSTRAINT "reports_file_type_check" CHECK ("reports"."file_type" IN ('pdf', 'csv', 'json')),
	CONSTRAINT "reports_status_check" CHECK ("reports"."status" IN ('completed', 'failed'))
);
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "reports_generated_by_idx" ON "reports" USING btree ("generated_by");
--> statement-breakpoint
CREATE INDEX "reports_farm_id_idx" ON "reports" USING btree ("farm_id");
--> statement-breakpoint
CREATE INDEX "reports_generated_at_idx" ON "reports" USING btree ("generated_at");
