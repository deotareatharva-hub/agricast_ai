import { CloudSun } from "lucide-react";
import EmptyState from "../../../components/ui/EmptyState";

// Thin wrapper around the shared EmptyState so every "nothing to show"
// moment in the Weather module (no farm picked, no history in range yet)
// gets the same CloudSun visual without repeating the icon choice.
export default function EmptyWeatherState({ title, description, action }) {
  return <EmptyState icon={CloudSun} title={title} description={description} action={action} />;
}
