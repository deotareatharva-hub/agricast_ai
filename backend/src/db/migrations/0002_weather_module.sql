CREATE TABLE "weather_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"forecast_type" varchar(20) NOT NULL,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weather_cache_forecast_type_check" CHECK ("weather_cache"."forecast_type" IN ('current', 'hourly', 'daily'))
);
--> statement-breakpoint
CREATE TABLE "weather_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"temperature" numeric(5, 2),
	"humidity" numeric(5, 2),
	"wind_speed" numeric(6, 2),
	"wind_direction" numeric(5, 1),
	"pressure" numeric(7, 2),
	"rain_probability" numeric(5, 2),
	"uv_index" numeric(4, 1),
	"weather_code" integer,
	"source" varchar(30) DEFAULT 'open-meteo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weather_history_humidity_check" CHECK ("weather_history"."humidity" IS NULL OR ("weather_history"."humidity" >= 0 AND "weather_history"."humidity" <= 100)),
	CONSTRAINT "weather_history_rain_probability_check" CHECK ("weather_history"."rain_probability" IS NULL OR ("weather_history"."rain_probability" >= 0 AND "weather_history"."rain_probability" <= 100))
);
--> statement-breakpoint
ALTER TABLE "weather_cache" ADD CONSTRAINT "weather_cache_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "weather_history" ADD CONSTRAINT "weather_history_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "weather_cache_farm_id_forecast_type_unique" ON "weather_cache" USING btree ("farm_id","forecast_type");
--> statement-breakpoint
CREATE INDEX "weather_cache_expires_at_idx" ON "weather_cache" USING btree ("expires_at");
--> statement-breakpoint
CREATE INDEX "weather_history_farm_id_idx" ON "weather_history" USING btree ("farm_id");
--> statement-breakpoint
CREATE INDEX "weather_history_recorded_at_idx" ON "weather_history" USING btree ("recorded_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "weather_history_farm_id_recorded_at_unique" ON "weather_history" USING btree ("farm_id","recorded_at");
