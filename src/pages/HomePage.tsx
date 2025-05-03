import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
// import calcData from "./calculationPS_small.json";
import calcData from "./calculationPS_small (2).json";

const bad = [
  "date",
  "redelivery_after_battery [kWh]",
  "curtailment_after_battery [kWh]",
  "consumption [kWh]", // "consumption_from_grid_before_battery [kWh]",
  "consumption_from_grid_after_battery [kWh]",
  "optimized_exceeded_grid_values [kW]",
];

const keys = Object.keys(calcData).filter((it) => !bad.includes(it));

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

const lastKeys = [
  "consumption_from_grid_before_battery [kWh]",
  "battery_usage [kW]",
  "generator_capacity [kWh]",
  "power_from_grid_after_generator [kW]",
];

// const limit = 100;
// const limit = 500;
const limit = 1000;
// const limit = 10_000;
// const limit = calcData.date.length;

/*
ALL KEYS

date,consumption [kWh],net_from_grid [kWh],consumption_from_grid_before_battery [kWh],
consumption_from_grid_after_battery [kWh],redelivery_after_battery [kWh],curtailment_after_battery [kWh],
consumption_covered_by_battery [kWh],current_battery_capacity [kWh],
exceeded_grid_values [kWh],generator_capacity [kWh]

battery_state_of_charge [%],

power_from_grid_after_battery [kW],optimized_exceeded_grid_values [kW],
battery_usage [kW],power_from_grid_after_generator [kW]

*/

export function HomePage() {
  /*const lastKeys = [
  "consumption_from_grid_before_battery [kWh]",
  "battery_usage [kW]",
  "generator_capacity [kWh]",
  "power_from_grid_after_generator [kW]",
];
*/ return (
    <div style={{ display: "grid", gap: "12px", padding: "50px" }}>
      <CalendarHeatmap
        name={"consumption_from_grid_before_battery [kWh]"}
        data={calcData["date"]}
        values={calcData["consumption_from_grid_before_battery [kWh]"].map(
          (it) => Math.abs(it) / 24,
        )}
        threshold={155}
      />
      <CalendarHeatmap
        name={"battery_usage [kW]"}
        data={calcData["date"]}
        values={calcData["battery_usage [kW]"].map((it) => Math.abs(it) / 4)}
        threshold={null}
      />
      <CalendarHeatmap
        name={"generator_capacity [kWh]"}
        data={calcData["date"]}
        values={calcData["generator_capacity [kWh]"].map(
          (it) => Math.abs(it) / 24,
        )}
        threshold={null}
      />
      <CalendarHeatmap
        name={"power_from_grid_after_generator [kW]"}
        data={calcData["date"]}
        values={calcData["power_from_grid_after_generator [kW]"].map(
          (it) => it / (4 * 24),
        )}
        threshold={155}
      />

      {/*
      {keys.map((key) => {
        return (
          <CalendarHeatmap
            key={key}
            name={key}
            data={calcData["date"]}
            values={calcData[key]}
          />
        );
      })}
      */}
    </div>
  );
}

const CalendarHeatmap = ({
  data,
  values,
  name = "Calendar Heatmap",
  threshold = null,
}: {
  data: number[];
  values: number[];
  name: string;
  threshold?: number | null;
}) => {
  const svgRef = useRef(null);
  const [minMax, setMinMax] = useState([0, 0, 0]);

  useEffect(() => {
    // Clear any existing chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Exit early if no data
    if (!data || !values || data.length === 0) {
      return;
    }

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
          existing.sum += value;
        } else {
          dailyData.set(dateStr, {
            date: date,
            sum: value,
            // We'll flag if it exceeds threshold
            exceedsThreshold: threshold !== null && value > threshold,
          });
        }
      });

      // Convert map to array and check final sums against threshold
      return Array.from(dailyData.values())
        .map((item) => ({
          ...item,
          exceedsThreshold: threshold !== null && item.sum > threshold,
        }))
        .sort((a, b) => a.date - b.date);
    };

    const processedData = processData();

    // Chart configuration
    const cellSize = 16; // height of a day
    const height = cellSize * 9; // height with padding for labels
    const width = cellSize * 53 + 60 + 200; // width with padding for legend

    // Define formatting functions
    const formatValue = d3.format("+.2%");
    const formatClose = d3.format("$,.2f");
    const formatDate = d3.utcFormat("%x");
    const formatDay = (i) => "SMTWTFS"[i];
    const formatMonth = d3.utcFormat("%b");

    // Helpers for positioning
    const timeWeek = d3.timeSunday;
    const countDay = (i) => i; // 0 = Sunday, 1 = Monday, etc.

    // Compute color scale - white to green
    const min = d3.min(processedData, (d) => d.sum) || 0;
    const max = d3.max(processedData, (d) => d.sum) || 1;
    const total = d3.sum(processedData, (d) => d.sum) || 0;

    // Update state with min/max values
    setMinMax([min, max, total]);

    const color = d3
      .scaleLinear()
      .domain([min, max])
      .range(["#ffffff", "#06D6A0"]);

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
      .attr("width", cellSize - 1)
      .attr("height", cellSize - 1)
      .attr(
        "x",
        (d) => timeWeek.count(d3.timeYear(d.date), d.date) * cellSize + 40.5,
      )
      .attr("y", (d) => d.date.getDay() * cellSize + 0.5)
      .attr("fill", (d) => color(d.sum))
      .attr("stroke", (d) => (d.exceedsThreshold ? "#FF0000" : "none"))
      .attr("stroke-width", (d) => (d.exceedsThreshold ? 2 : 0))
      .append("title")
      .text(
        (d) => `${formatDate(d.date)}
Value: ${d.sum.toFixed(2)}
${d.exceedsThreshold ? `⚠️ Exceeds threshold (${threshold})` : ""}`,
      );

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
      .attr("stroke-width", 3)
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
    const legendHeight = 20;
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
      .tickFormat(d3.format(".2f"));

    const legend = svg
      .append("g")
      .attr("transform", `translate(${legendX}, ${legendY})`);

    const defs = svg.append("defs");

    const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`; // Generate unique ID

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

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", -6)
      .attr("font-weight", "bold")
      .text("Daily Value");

    // Add threshold marker if threshold is provided
    if (threshold !== null) {
      // Calculate position of threshold on the scale
      const thresholdPosition = legendScale(
        Math.min(Math.max(threshold, min), max),
      );

      legend
        .append("line")
        .attr("x1", thresholdPosition)
        .attr("x2", thresholdPosition)
        .attr("y1", -10)
        .attr("y2", 12)
        .attr("stroke", "#FF0000")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "3,3");

      legend
        .append("text")
        .attr("x", thresholdPosition - 65)
        .attr("y", -6)
        .attr("font-size", "8px")
        .attr("fill", "#FF0000")
        .text(`Threshold: ${threshold}`);
    }
  }, [data, values, threshold]);

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow">
      <h3 className="text-xl font-bold mb-2">
        {name} Total: {minMax[2].toFixed(2)}
      </h3>
      {minMax[0] !== minMax[1] && (
        <p className="text-sm text-gray-600 mb-2">
          {threshold !== null && (
            <span className="ml-2">
              Threshold:{" "}
              <span className="text-red-500 font-medium">{threshold}</span>
            </span>
          )}
        </p>
      )}
      <svg ref={svgRef} className="w-full"></svg>
    </div>
  );
};
