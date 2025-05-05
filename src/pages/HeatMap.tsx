import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const colors = [
  "#e60049",
  "#0bb4ff",
  "#50e991",
  "#e6d800",
  "#9b19f5",
  "#ffa300",
  "#dc0ab4",
  "#b3d4ff",
  "#00bfa0",
];

export function CalendarHeatmap({
  data = [],
  values = [],
  name = "Calendar Heatmap",
  threshold = null,
  highlightDate = null,
  onSelect,
}: {
  data: number[];
  values: number[];
  name: string;
  threshold?: number | null;
  highlightDate?: string | null;
  onSelect?: (day: any) => void;
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    // Clear any existing chart
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Exit early if no data
    if (!data || !values || data.length === 0) {
      console.log("No data to render");
      return;
    }

    const highlightDateStr = highlightDate
      ? new Date(highlightDate).toISOString().split("T")[0]
      : null;

    // Process the incoming data
    const processData = () => {
      // Group timestamps and values by day
      const dailyData = new Map();

      data.forEach((timestamp, index) => {
        if (index >= values.length) {
          console.log("Missing value for timestamp", timestamp);
          return;
        }

        const date = new Date(timestamp);
        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD format
        const value = values[index];
        const hour = date.getHours();
        const quarterHour = Math.floor(date.getMinutes() / 15);
        const timeSlot = hour * 4 + quarterHour; // 0-95 for the 96 slots in a day

        if (!dailyData.has(dateStr)) {
          // Initialize an array of 96 null values for each day
          const dayValues = Array(96).fill(null);
          dailyData.set(dateStr, {
            date: date,
            values: dayValues,
            exceedsThreshold: false,
            isHighlighted: highlightDateStr === dateStr,
          });
        }

        // Store the value in the appropriate time slot
        const dayData = dailyData.get(dateStr);
        dayData.values[timeSlot] = value;

        // Check if any value exceeds threshold
        if (threshold !== null && value > threshold) {
          dayData.exceedsThreshold = true;
        }
      });

      const processed = Array.from(dailyData.values()).sort(
        (a, b) => a.date - b.date,
      );
      console.log("Processed", processed.length, "days of data");
      return processed;
    };

    const processedData = processData();
    if (processedData.length === 0) {
      console.log("No days after processing");
      return;
    }

    // Chart configuration
    const cellSize = 24; // Increased cell size to fit the 96 values
    const pixelSize = 2; // Size of each individual value pixel
    const pixelsPerRow = 12; // 12x8 grid = 96 pixels
    const pixelsPerCol = 8;
    const height = cellSize * 9; // height with padding for labels
    const width = cellSize * 53 + 60 + 200; // width with padding for legend

    // Define formatting functions
    const formatDate = d3.utcFormat("%x");
    const formatDay = (i) => "SMTWTFS"[i];
    const formatMonth = d3.utcFormat("%b");
    const formatHour = (i) =>
      `${Math.floor(i / 4)}:${(i % 4) * 15 === 0 ? "00" : (i % 4) * 15}`;

    // Helpers for positioning
    const timeWeek = d3.timeSunday;
    const countDay = (i) => i; // 0 = Sunday, 1 = Monday, etc.

    // Compute color scales with threshold
    let allValues = processedData.flatMap((d) =>
      d.values.filter((v) => v !== null),
    );
    const min = d3.min(allValues) || 0;
    const max = d3.max(allValues) || 1; // Ensure we don't divide by zero

    console.log("Value range:", min, "to", max, "threshold:", threshold);

    // Create two different color scales based on threshold
    const colorBelow = d3
      .scaleLinear()
      .domain([min, threshold !== null ? threshold : max])
      .range(["#f2faf7", "#06D6A0"]);

    const lightRed = "#ffcccb";

    const colorAbove = d3
      .scaleLinear()
      .domain([threshold !== null ? threshold : min, max])
      .range([lightRed, "#ff0000"]);

    // Function to determine color based on value and threshold
    const getColor = (value) => {
      if (value === null) return "#f9f9f9";
      if (threshold === null || value <= threshold) {
        return colorBelow(value);
      } else {
        return colorAbove(value);
      }
    };

    // Create SVG element with explicit dimensions
    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    // Function to draw month separator lines
    function pathMonth(t) {
      const d = Math.max(0, Math.min(6, countDay(t.getDay())));
      const w = timeWeek.count(d3.timeYear(t), t);
      return `${
        d === 0
          ? `M${w * cellSize + 40},0`
          : `M${(w + 1) * cellSize + 40},0V${d * cellSize}H${w * cellSize + 40}`
      }V${7 * cellSize}`;
    }

    // Group data by year
    const year = svg
      .append("g")
      .attr("transform", `translate(0,${cellSize * 1.5})`);

    // Add year label
    year
      .append("text")
      .attr("x", 15)
      .attr("y", -5)
      .attr("font-weight", "bold")
      .attr("text-anchor", "start")
      .text(processedData[0].date.getFullYear());

    // Add day labels (Sun, Mon, etc.)
    year
      .append("g")
      .attr("text-anchor", "end")
      .selectAll("text")
      .data(d3.range(7))
      .join("text")
      .attr("x", 35)
      .attr("y", (d) => (d + 0.5) * cellSize)
      .attr("dy", "0.31em")
      .text(formatDay);

    // Add day cell backgrounds
    year
      .append("g")
      .selectAll("rect.day-bg")
      .data(processedData)
      .join("rect")
      .attr("class", "day-bg")
      .attr("width", cellSize - 1)
      .attr("height", cellSize - 1)
      .attr(
        "x",
        (d) => timeWeek.count(d3.timeYear(d.date), d.date) * cellSize + 40,
      )
      .attr("y", (d) => d.date.getDay() * cellSize)
      .attr("fill", "#fff")
      // .attr("stroke", "#e0e0e0")
      // .attr("stroke-width", 0.5)
      .on("click", (event, d) => {
        if (onSelect) onSelect(d);
      });

    // For each day, add individual pixels for each value
    processedData.forEach((dayData) => {
      const dayX =
        timeWeek.count(d3.timeYear(dayData.date), dayData.date) * cellSize +
        40 +
        1;
      const dayY = dayData.date.getDay() * cellSize + 1;

      const dayGroup = year
        .append("g")
        .attr("class", "day-pixels")
        .attr("style", "pointer-events:none;")
        .attr("transform", `translate(${dayX}, ${dayY})`);

      // Add each value as a small colored rect
      dayData.values.forEach((value, i) => {
        if (!value) return;

        const row = Math.floor(i / pixelsPerRow);
        const col = i % pixelsPerRow;

        dayGroup
          .append("rect")
          .attr("width", pixelSize)
          .attr("height", pixelSize)
          .attr("x", col * pixelSize)
          .attr("y", row * pixelSize)
          .attr("fill", getColor(value));
        // rgb(242, 250, 247)
        // .attr("opacity", value !== null ? 1 : 0.3)
        //           .append("title")
        //           .text(
        //             value !== null
        //               ? `${formatDate(dayData.date)}
        // Time: ${formatHour(i)}
        // Value: ${value.toFixed(2)}
        // ${threshold !== null && value > threshold ? `⚠️ Exceeds threshold (${threshold})` : ""}`
        //               : "No data",
        //           );
      });
    });

    // Add a highlight effect for the highlighted day if there is any
    if (highlightDate) {
      const highlightedData = processedData.find((d) => d.isHighlighted);

      if (highlightedData) {
        year
          .append("rect")
          .attr("width", cellSize + 1)
          .attr("height", cellSize + 1)
          .attr(
            "x",
            timeWeek.count(
              d3.timeYear(highlightedData.date),
              highlightedData.date,
            ) *
              cellSize +
              40 -
              1,
          )
          .attr("y", highlightedData.date.getDay() * cellSize - 1)
          .attr("fill", "none")
          .attr("stroke", "#0000FF")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "2,2")
          .attr("rx", 2)
          .attr("ry", 2);
      }
    }

    // Add month outlines and labels
    const months = year
      .append("g")
      .selectAll("g")
      .data(
        d3.timeMonths(
          new Date(processedData[0].date.getFullYear(), 0, 1),
          new Date(processedData[0].date.getFullYear() + 1, 0, 1),
        ),
      )
      .join("g");

    months
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "#e8e8e8")
      .attr("stroke-width", 2)
      .attr("d", pathMonth);

    months
      .append("text")
      .attr(
        "x",
        (d) => timeWeek.count(d3.timeYear(d), timeWeek.ceil(d)) * cellSize + 42,
      )
      .attr("y", 175)
      .text((it, i) => {
        return "JanFebMarAprMayJunJulAugSepOctNovDec".slice(i * 3, (i + 1) * 3);
      });

    // Add legend
    const legendWidth = 200;
    const legendX = width - legendWidth - 10;
    const legendY = height - 30;

    const legendScale = d3
      .scaleLinear()
      .domain([min, max])
      .range([0, legendWidth]);

    const legendAxis = d3
      .axisBottom(legendScale)
      .tickSize(6)
      .ticks(5)
      .tickFormat(d3.format(".1f"));

    const legend = svg
      .append("g")
      .attr("transform", `translate(${legendX}, ${legendY})`);

    const defs = svg.append("defs");

    // Create gradient IDs with random suffixes to ensure uniqueness
    const gradientIdBelow = `gradient-below-${Math.random().toString(36).slice(2, 9)}`;
    const gradientIdAbove = `gradient-above-${Math.random().toString(36).slice(2, 9)}`;

    // Create gradient for values below threshold
    const gradientBelow = defs
      .append("linearGradient")
      .attr("id", gradientIdBelow)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    gradientBelow
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#ffffff");
    gradientBelow
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#06D6A0");

    // Create gradient for values above threshold
    const gradientAbove = defs
      .append("linearGradient")
      .attr("id", gradientIdAbove)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    gradientAbove
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", lightRed);
    gradientAbove
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#ff0000");

    // Calculate the position of threshold on the legend scale
    const thresholdPosition =
      threshold !== null
        ? legendScale(Math.min(Math.max(threshold, min), max))
        : legendWidth;

    // Add rectangle for values below threshold
    legend
      .append("rect")
      .attr("width", threshold !== null ? thresholdPosition : legendWidth)
      .attr("height", 8)
      .style("fill", `url(#${gradientIdBelow})`);

    // Add rectangle for values above threshold
    if (threshold !== null) {
      legend
        .append("rect")
        .attr("x", thresholdPosition)
        .attr("width", legendWidth - thresholdPosition)
        .attr("height", 8)
        .style("fill", `url(#${gradientIdAbove})`);
    }

    legend.append("g").attr("transform", `translate(0, 8)`).call(legendAxis);

    if (threshold !== null) {
      // Add a vertical line at threshold
      legend
        .append("line")
        .attr("x1", thresholdPosition)
        .attr("x2", thresholdPosition)
        .attr("y1", -5)
        .attr("y2", 13)
        .attr("stroke", "#FF0000")
        .attr("stroke-width", 2);

      legend
        .append("text")
        .attr("x", thresholdPosition - 5)
        .attr("y", -10)
        .attr("font-size", "8px")
        .attr("fill", "#FF0000")
        .text(`${threshold}`);
    }

    // Add time legend showing the pixel arrangement
    const timeLegendX = width - 200;
    const timeLegendY = height - 100;

    const timeLegend = svg
      .append("g")
      .attr("transform", `translate(${timeLegendX}, ${timeLegendY})`);

    timeLegend
      .append("text")
      .attr("font-weight", "bold")
      .text("Time format (96 values per day):");

    timeLegend
      .append("text")
      .attr("y", 15)
      .text("Each pixel represents 15 minutes");

    // Example grid showing the layout
    const exampleGrid = timeLegend
      .append("g")
      .attr("transform", "translate(0, 25)");

    exampleGrid
      .append("rect")
      .attr("width", pixelSize * pixelsPerRow + 2)
      .attr("height", pixelSize * pixelsPerCol + 2)
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 1)
      .attr("transform", "translate(-1, -1)");

    // Add hour labels for the example
    for (let h = 0; h < 24; h += 6) {
      exampleGrid
        .append("text")
        .attr("x", ((h * 4) / pixelsPerRow) * (pixelSize * pixelsPerRow) - 5)
        .attr("y", -5)
        .attr("font-size", "8px")
        .text(`${h}:00`);
    }
  }, [data, values, threshold, highlightDate]); // Update when data, values, threshold, or highlightDate changes

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow">
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <svg ref={svgRef} className="w-full"></svg>

      {(!data || data.length === 0) && (
        <div className="text-center py-6 text-gray-500">No data available.</div>
      )}
    </div>
  );
}
