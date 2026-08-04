import PDFDocument from "pdfkit";

// Renders the aggregated report snapshot as a PDF using PDFKit, streamed
// entirely in-memory (no temp files) and resolved as a single Buffer -
// reports.service.js hands that Buffer straight to utils/fileStorage.js.
// PDFKit was chosen over pdf-lib because report generation here is
// "compose a new document from data" (headings, paragraphs, simple
// tables), which is PDFKit's strength; pdf-lib is better suited to
// editing/filling *existing* PDFs (already used for that job by the `pdf`
// skill elsewhere in this codebase's tooling), so using it here would be
// the wrong tool for a document generated from scratch.

const PAGE_MARGIN = 50;
const COLORS = {
  heading: "#1B4332",
  subheading: "#2D6A4F",
  text: "#212529",
  muted: "#6C757D",
  rule: "#DEE2E6",
};

function addSectionTitle(doc, title) {
  doc.moveDown(1);
  doc
    .fontSize(14)
    .fillColor(COLORS.subheading)
    .font("Helvetica-Bold")
    .text(title.toUpperCase());
  doc
    .moveTo(doc.x, doc.y + 2)
    .lineTo(doc.page.width - PAGE_MARGIN, doc.y + 2)
    .strokeColor(COLORS.rule)
    .stroke();
  doc.moveDown(0.5);
  doc.font("Helvetica").fillColor(COLORS.text).fontSize(10);
}

function addKeyValue(doc, key, value) {
  if (value === null || value === undefined || value === "") return;
  const display = typeof value === "object" ? JSON.stringify(value) : String(value);
  doc
    .font("Helvetica-Bold")
    .fillColor(COLORS.text)
    .fontSize(10)
    .text(`${key}: `, { continued: true })
    .font("Helvetica")
    .fillColor(COLORS.text)
    .text(display);
}

function addUnavailable(doc) {
  doc.font("Helvetica-Oblique").fillColor(COLORS.muted).fontSize(10).text("Not available");
  doc.font("Helvetica").fillColor(COLORS.text);
}

function renderFarmSection(doc, farm) {
  addSectionTitle(doc, "Farm Details");
  addKeyValue(doc, "Farm Name", farm.farmName);
  addKeyValue(doc, "Crop", farm.crop);
  addKeyValue(doc, "Area", `${farm.area} ${farm.areaUnit}`);
  addKeyValue(doc, "Location", `${farm.village}, ${farm.district}, ${farm.state}, ${farm.country}`);
  addKeyValue(doc, "Coordinates", `${farm.latitude}, ${farm.longitude}`);
}

function renderWeatherSection(doc, weather) {
  addSectionTitle(doc, "Current Weather");
  if (weather?.current) {
    Object.entries(weather.current).forEach(([key, value]) => addKeyValue(doc, key, value));
  } else {
    addUnavailable(doc);
  }

  addSectionTitle(doc, "Forecast");
  if (Array.isArray(weather?.forecast) && weather.forecast.length > 0) {
    weather.forecast.slice(0, 14).forEach((entry, idx) => {
      doc.font("Helvetica-Bold").fontSize(10).text(`Day ${idx + 1}`);
      Object.entries(entry).forEach(([key, value]) => addKeyValue(doc, key, value));
      doc.moveDown(0.3);
    });
  } else {
    addUnavailable(doc);
  }
}

function renderAiSection(doc, aiRecommendation) {
  addSectionTitle(doc, "AI Recommendation");
  if (aiRecommendation) {
    addKeyValue(doc, "Confidence", `${aiRecommendation.confidence}%`);
    if (aiRecommendation.summary) {
      doc.moveDown(0.3);
      doc.font("Helvetica-Bold").text("Summary");
      doc.font("Helvetica").text(String(aiRecommendation.summary), { align: "left" });
    }
    addKeyValue(doc, "Disease Risk", aiRecommendation.diseaseRisk);
    addKeyValue(doc, "Irrigation Advice", aiRecommendation.irrigation);
    addKeyValue(doc, "Harvest Advice", aiRecommendation.harvest);
    if (aiRecommendation.alerts) {
      addKeyValue(doc, "Alerts", aiRecommendation.alerts);
    }
  } else {
    addUnavailable(doc);
  }
}

function renderSatelliteSection(doc, satellite) {
  addSectionTitle(doc, "Satellite Summary");
  if (satellite) {
    Object.entries(satellite).forEach(([key, value]) => addKeyValue(doc, key, value));
  } else {
    addUnavailable(doc);
  }
}

function renderSensorSection(doc, sensorSnapshot) {
  addSectionTitle(doc, "Sensor Snapshot");
  if (sensorSnapshot) {
    Object.entries(sensorSnapshot).forEach(([key, value]) => addKeyValue(doc, key, value));
  } else {
    addUnavailable(doc);
  }
}

export const pdfGenerator = {
  // snapshot: object from reportDataAggregator.gather().
  // reportMeta: { reportType, farmId, generatedAt }.
  // Resolves to a Buffer containing the finished PDF.
  generate: (snapshot, reportMeta) => {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: PAGE_MARGIN, size: "A4", bufferPages: true });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      try {
        doc
          .fontSize(20)
          .fillColor(COLORS.heading)
          .font("Helvetica-Bold")
          .text("AgriCast AI", { align: "left" });
        doc
          .fontSize(12)
          .fillColor(COLORS.muted)
          .font("Helvetica")
          .text(`${formatReportTypeLabel(reportMeta.reportType)} Report`);
        doc
          .fontSize(9)
          .fillColor(COLORS.muted)
          .text(`Generated: ${new Date(snapshot.generatedAt).toLocaleString()}`);
        doc
          .moveTo(PAGE_MARGIN, doc.y + 8)
          .lineTo(doc.page.width - PAGE_MARGIN, doc.y + 8)
          .strokeColor(COLORS.rule)
          .stroke();

        renderFarmSection(doc, snapshot.farm);
        renderWeatherSection(doc, snapshot.weather);
        renderAiSection(doc, snapshot.aiRecommendation);
        renderSatelliteSection(doc, snapshot.satellite);
        renderSensorSection(doc, snapshot.sensorSnapshot);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  },
};

function formatReportTypeLabel(reportType) {
  const labels = {
    today: "Today's",
    weekly: "Weekly",
    monthly: "Monthly",
    recommendation: "Recommendation",
  };
  return labels[reportType] || reportType;
}
