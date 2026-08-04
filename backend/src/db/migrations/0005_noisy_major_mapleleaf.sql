ALTER TABLE "weather_cache" DROP CONSTRAINT "weather_cache_forecast_type_check";--> statement-breakpoint
ALTER TABLE "weather_history" DROP CONSTRAINT "weather_history_humidity_check";--> statement-breakpoint
ALTER TABLE "weather_history" DROP CONSTRAINT "weather_history_rain_probability_check";--> statement-breakpoint
ALTER TABLE "satellite_cache" DROP CONSTRAINT "satellite_cache_layer_check";--> statement-breakpoint
ALTER TABLE "satellite_requests" DROP CONSTRAINT "satellite_requests_status_check";--> statement-breakpoint
ALTER TABLE "recommendations" DROP CONSTRAINT "recommendations_language_check";--> statement-breakpoint
ALTER TABLE "recommendations" DROP CONSTRAINT "recommendations_confidence_check";--> statement-breakpoint
DROP INDEX "farms_user_id_farm_name_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "farms_user_id_farm_name_unique" ON "farms" USING btree ("user_id","farm_name") WHERE "farms"."deleted_at" IS NULL;--> statement-breakpoint
ALTER TABLE "weather_cache" ADD CONSTRAINT "weather_cache_forecast_type_check" CHECK ("weather_cache"."forecast_type" IN ('current', 'hourly', 'daily'));--> statement-breakpoint
ALTER TABLE "weather_history" ADD CONSTRAINT "weather_history_humidity_check" CHECK ("weather_history"."humidity" IS NULL OR ("weather_history"."humidity" >= 0 AND "weather_history"."humidity" <= 100));--> statement-breakpoint
ALTER TABLE "weather_history" ADD CONSTRAINT "weather_history_rain_probability_check" CHECK ("weather_history"."rain_probability" IS NULL OR ("weather_history"."rain_probability" >= 0 AND "weather_history"."rain_probability" <= 100));--> statement-breakpoint
ALTER TABLE "satellite_cache" ADD CONSTRAINT "satellite_cache_layer_check" CHECK ("satellite_cache"."layer" IN ('TRUE_COLOR', 'FALSE_COLOR', 'NDVI', 'MOISTURE_INDEX', 'EVI'));--> statement-breakpoint
ALTER TABLE "satellite_requests" ADD CONSTRAINT "satellite_requests_status_check" CHECK ("satellite_requests"."status" IN ('success', 'error'));--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_language_check" CHECK ("recommendations"."language" IN ('en', 'hi', 'mr'));--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_confidence_check" CHECK ("recommendations"."confidence" >= 0 AND "recommendations"."confidence" <= 100);