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
    d3.select(svgRef.current).selectAll("*").remove();

    // Exit early if no data
    if (!data || !values || data.length === 0) {
      return;
    }

    const highlightDateStr = new Date(highlightDate)
      .toISOString()
      .split("T")[0];

    // Process the incoming data
    const processData = () => {
      // Map timestamps to date objects and values
      const dailyData = new Map();

      data.forEach((timestamp, index) => {
        const date = new Date(timestamp);
        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD format
        const value = values[index];

        // If we already have an entry for this day, sum the values
        if (dailyData.has(dateStr)) {
          const existing = dailyData.get(dateStr);
          existing.value += value;
          existing.exceedsThreshold = threshold && existing.value > threshold;
        } else {
          dailyData.set(dateStr, {
            date: date,
            value: value,
            exceedsThreshold: threshold && value > threshold,
            isHighlighted:
              highlightDate !== null && highlightDateStr === dateStr,
          });
        }
      });

      // Convert map to array and check final sums against threshold
      return Array.from(dailyData.values()).sort((a, b) => a.date - b.date);
    };

    const processedData = processData();

    // Chart configuration
    const cellSize = 16; // height of a day
    const height = cellSize * 9; // height with padding for labels
    const width = cellSize * 53 + 60 + 200; // width with padding for legend

    // Define formatting functions
    const formatDate = d3.utcFormat("%x");
    const formatDay = (i) => "SMTWTFS"[i];
    const formatMonth = d3.utcFormat("%b");

    // Helpers for positioning
    const timeWeek = d3.timeSunday;
    const countDay = (i) => i; // 0 = Sunday, 1 = Monday, etc.

    // Compute color scale - white to green
    const min = d3.min(processedData, (d) => d.value);
    const max = d3.max(processedData, (d) => d.value);

    const color = d3
      .scaleLinear()
      .domain([min, max])
      .range(["#f2faf7", "#06D6A0"]);

    // Create SVG element
    const svg = d3
      .select(svgRef.current)
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
      .text(new Date(data[0]).getFullYear());

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

    // Add colored cells for each day
    year
      .append("g")
      .selectAll("rect")
      .data(processedData)
      .join("rect")
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr(
        "x",
        (d) => timeWeek.count(d3.timeYear(d.date), d.date) * cellSize + 40,
      )
      .attr("y", (d) => d.date.getDay() * cellSize)
      .attr("fill", (d) => color(d.value))
      .attr("stroke", (d) => {
        // if (d.isHighlighted) return "#0000FF"; // Blue for highlighted
        if (d.exceedsThreshold) return "#FF0000"; // Red for threshold exceeded
        return "none";
      })
      .on("click", (event, d) => {
        onSelect(d);
      })
      .append("title")
      .text(
        (d) => `${formatDate(d.date)}
Value: ${d.value.toFixed(2)}
${d.exceedsThreshold ? `⚠️ Exceeds threshold (${threshold})` : ""}
${d.isHighlighted ? `📌 Highlighted day` : ""}`,
      );

    // Add a highlight effect for the highlighted day if there is any
    if (highlightDate) {
      const highlightedData = processedData.find((d) => d.isHighlighted);

      if (highlightedData) {
        year
          .append("rect")
          .attr("width", cellSize + 3)
          .attr("height", cellSize + 3)
          .attr(
            "x",
            timeWeek.count(
              d3.timeYear(highlightedData.date),
              highlightedData.date,
            ) *
              cellSize +
              40.5 -
              2,
          )
          .attr("y", highlightedData.date.getDay() * cellSize + 0.5 - 2)
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
          new Date(new Date(data[0]).getFullYear(), 0, 1),
          new Date(new Date(data[0]).getFullYear() + 1, 0, 1),
        ),
      )
      .join("g");

    months
      .filter((d, i) => i)
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("d", pathMonth);

    months
      .append("text")
      .attr(
        "x",
        (d) => timeWeek.count(d3.timeYear(d), timeWeek.ceil(d)) * cellSize + 42,
      )
      .attr("y", -5)
      .text(formatMonth);

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
      .tickFormat(d3.format(".0f"));

    const legend = svg
      .append("g")
      .attr("transform", `translate(${legendX}, ${legendY})`);

    const defs = svg.append("defs");

    const gradientId = `gradient-${Math.random().toString(36).slice(2, 9)}`;

    const gradient = defs
      .append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#ffffff");

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#06D6A0");

    legend
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", 8)
      .style("fill", `url(#${gradientId})`);

    legend.append("g").attr("transform", `translate(0, 8)`).call(legendAxis);

    if (threshold !== null) {
      // Calculate position of threshold on the scale
      const thresholdPosition = legendScale(
        Math.min(Math.max(threshold, min), max),
      );

      legend
        .append("line")
        .attr("x1", thresholdPosition)
        .attr("x2", thresholdPosition)
        .attr("y1", -5)
        .attr("y2", 5)
        .attr("stroke", "#FF0000")
        .attr("stroke-width", 1);

      legend
        .append("text")
        .attr("x", thresholdPosition - 5)
        .attr("y", -10)
        .attr("font-size", "8px")
        .attr("fill", "#FF0000")
        .text(`${threshold}`);
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
