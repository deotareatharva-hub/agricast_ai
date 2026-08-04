// Builds report content as CSV text. Deliberately dependency-free (hand-
// rolled CSV escaping) rather than pulling in `csv-writer`, since the
// report content is a flat "field, value" table, not a large tabular
// dataset - a full CSV-writing library would be overkill for this shape
// and keeps the reports integration's footprint minimal, matching how
// utils/logger.js avoids a logging framework for a similarly simple job.
//
// Output shape: one row per fact, grouped by section, so the CSV opens
// cleanly in Excel/Sheets as a readable report rather than a wide,
// hard-to-read single row.

function escapeCsvValue(value) {
  if (value === null || value === undefined) return "";
  const str = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(...cells) {
  return cells.map(escapeCsvValue).join(",");
}

function section(lines, title) {
  lines.push("");
  lines.push(row(title.toUpperCase()));
}

export const csvGenerator = {
  // snapshot: the object produced by reportDataAggregator.gather().
  // reportMeta: { reportType, farmId, generatedAt }.
  generate: (snapshot, reportMeta) => {
    const lines = [];

    lines.push(row("AgriCast AI - Report"));
    lines.push(row("Report Type", reportMeta.reportType));
    lines.push(row("Generated At", snapshot.generatedAt));

    section(lines, "Farm Details");
    lines.push(row("Field", "Value"));
    Object.entries(snapshot.farm).forEach(([key, value]) => {
      lines.push(row(key, value));
    });

    section(lines, "Current Weather");
    if (snapshot.weather?.current) {
      lines.push(row("Field", "Value"));
      Object.entries(snapshot.weather.current).forEach(([key, value]) => {
        lines.push(row(key, value));
      });
    } else {
      lines.push(row("Not available"));
    }

    section(lines, "Forecast");
    if (Array.isArray(snapshot.weather?.forecast) && snapshot.weather.forecast.length > 0) {
      const columns = Object.keys(snapshot.weather.forecast[0]);
      lines.push(row(...columns));
      snapshot.weather.forecast.forEach((entry) => {
        lines.push(row(...columns.map((c) => entry[c])));
      });
    } else {
      lines.push(row("Not available"));
    }

    section(lines, "AI Recommendation");
    if (snapshot.aiRecommendation) {
      lines.push(row("Field", "Value"));
      lines.push(row("Confidence", snapshot.aiRecommendation.confidence));
      lines.push(row("Summary", snapshot.aiRecommendation.summary ?? ""));
      lines.push(row("Disease Risk", snapshot.aiRecommendation.diseaseRisk));
      lines.push(row("Irrigation Advice", snapshot.aiRecommendation.irrigation));
      lines.push(row("Harvest Advice", snapshot.aiRecommendation.harvest));
    } else {
      lines.push(row("Not available"));
    }

    section(lines, "Satellite Summary");
    if (snapshot.satellite) {
      lines.push(row("Field", "Value"));
      Object.entries(snapshot.satellite).forEach(([key, value]) => {
        lines.push(row(key, value));
      });
    } else {
      lines.push(row("Not available"));
    }

    section(lines, "Sensor Snapshot");
    if (snapshot.sensorSnapshot) {
      lines.push(row("Field", "Value"));
      Object.entries(snapshot.sensorSnapshot).forEach(([key, value]) => {
        lines.push(row(key, value));
      });
    } else {
      lines.push(row("Not available"));
    }

    return lines.join("\n") + "\n";
  },
};
