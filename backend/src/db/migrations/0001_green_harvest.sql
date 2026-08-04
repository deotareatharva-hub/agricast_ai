CREATE TABLE "farms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"farm_name" varchar(100) NOT NULL,
	"crop" varchar(100) NOT NULL,
	"area" numeric(10, 2) NOT NULL,
	"area_unit" varchar(20) DEFAULT 'acres' NOT NULL,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(9, 6) NOT NULL,
	"village" varchar(150) NOT NULL,
	"district" varchar(150) NOT NULL,
	"state" varchar(150) NOT NULL,
	"country" varchar(150) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "farms_latitude_check" CHECK ("farms"."latitude" >= -90 AND "farms"."latitude" <= 90),
	CONSTRAINT "farms_longitude_check" CHECK ("farms"."longitude" >= -180 AND "farms"."longitude" <= 180),
	CONSTRAINT "farms_area_positive_check" CHECK ("farms"."area" > 0)
);
--> statement-breakpoint
ALTER TABLE "farms" ADD CONSTRAINT "farms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "farms_user_id_idx" ON "farms" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "farms_deleted_at_idx" ON "farms" USING btree ("deleted_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "farms_user_id_farm_name_unique" ON "farms" USING btree ("user_id","farm_name") WHERE "farms"."deleted_at" is null;
