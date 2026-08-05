import { useMemo } from "react";
import {
  CloudSun,
  Droplets,
  Wind,
  Gauge,
  Sun,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { motion } from "framer-motion";

import { useCurrentWeather } from "../../features/weather/hooks/useCurrentWeather";

const weatherNames = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Cloudy",
  45: "Fog",
  48: "Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Heavy Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  71: "Snow",
  80: "Rain Showers",
  95: "Thunderstorm",
};

export default function WeatherHero({ farmId }) {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useCurrentWeather(farmId);

  const weather = useMemo(() => {
    if (!data) return null;

    return {
      temperature: data.temperature,
      humidity: data.humidity,
      pressure: data.pressure,
      windSpeed: data.windSpeed,
      windDirection: data.windDirection,
      uvIndex: data.uvIndex,
      weatherCode: data.weatherCode,
      observedAt: data.observedAt,
      units: data.units,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-3xl bg-white p-8 shadow-lg">
        <div className="h-10 w-48 rounded bg-gray-200" />

        <div className="mt-6 h-32 rounded-xl bg-gray-200" />
              </div>
            
        );
    }


  if (isError) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
        <div className="flex items-center gap-3">

          <AlertCircle className="text-red-500" />

          <div>

            <h2 className="font-bold text-red-700">
              Weather unavailable
            </h2>

            <p className="text-sm text-red-500">
              Unable to fetch weather from backend.
            </p>

          </div>

        </div>

        <button
          onClick={refetch}
          className="mt-6 rounded-xl bg-red-500 px-5 py-2 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[32px] bg-gradient-to-r from-green-600 via-emerald-600 to-lime-600 text-white shadow-2xl"
    >
      <div className="grid gap-8 p-8 lg:grid-cols-2">

        <div>

          <div className="flex items-center gap-3">

            <CloudSun size={42} />

            <div>

              <p className="text-green-100">

                Current Weather

              </p>

              <h2 className="text-5xl font-bold">

                {weather.temperature}
                °
              </h2>

            </div>

          </div>

          <h3 className="mt-6 text-2xl font-semibold">
            {weatherNames[weather.weatherCode] || "Weather"}
          </h3>

          <p className="mt-2 text-green-100">
            Last Updated

            {" "}

            {new Date(weather.observedAt).toLocaleTimeString()}
          </p>

        </div>
                {/* Right Side */}

        <div className="grid grid-cols-2 gap-5">

          <motion.div
            whileHover={{ scale: 1.04 }}
            className="rounded-3xl bg-white/15 p-5 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">

              <Droplets className="text-cyan-200" size={26} />

              <div>

                <p className="text-sm text-green-100">
                  Humidity
                </p>

                <h3 className="mt-2 text-3xl font-bold">
                  {weather.humidity}%
                </h3>

              </div>

            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.04 }}
            className="rounded-3xl bg-white/15 p-5 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">

              <Wind className="text-blue-200" size={26} />

              <div>

                <p className="text-sm text-green-100">
                  Wind
                </p>

                <h3 className="mt-2 text-3xl font-bold">
                  {weather.windSpeed}
                </h3>

                <span className="text-xs text-green-100">
                  km/h
                </span>

              </div>

            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.04 }}
            className="rounded-3xl bg-white/15 p-5 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">

              <Gauge className="text-orange-200" size={26} />

              <div>

                <p className="text-sm text-green-100">
                  Pressure
                </p>

                <h3 className="mt-2 text-3xl font-bold">
                  {weather.pressure}
                </h3>

                <span className="text-xs text-green-100">
                  hPa
                </span>

              </div>

            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.04 }}
            className="rounded-3xl bg-white/15 p-5 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">

              <Sun className="text-yellow-200" size={26} />

              <div>

                <p className="text-sm text-green-100">
                  UV Index
                </p>

                <h3 className="mt-2 text-3xl font-bold">
                  {weather.uvIndex}
                </h3>

              </div>

            </div>
          </motion.div>

        </div>

      </div>

      <div className="flex items-center justify-between border-t border-white/20 px-8 py-5">

        <div className="flex items-center gap-3">

          <div className="h-3 w-3 rounded-full bg-lime-300 animate-pulse" />

          <span className="text-sm text-green-100">
            Live data from Open-Meteo (cached by backend)
          </span>

        </div>

        <button
          onClick={refetch}
          className="flex items-center gap-2 rounded-xl bg-white/15 px-5 py-2 transition hover:bg-white/25"
        >
          <RefreshCw size={18} />

          Refresh
        </button>

      </div>
          </motion.section>
  );
}