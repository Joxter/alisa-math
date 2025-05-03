import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import calcData from "./calculationPS_small.json";

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

// const data = {
//   labels: .slice(0, limit),
//   datasets: keys.map((key, i) => {
//     let item = {
//       label: key,
//       data: calcData[key].slice(0, limit),
//       borderColor: colors[i],
//       hidden: true,
//     };
//     console.log(item);
//
//     return item;
//   }),
// };
export function HomePage() {
  //
  return (
    <div style={{ display: "grid", gap: "24px", padding: "50px" }}>
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
    </div>
  );
}

const CalendarHeatmap = ({
  data,
  values,
  name,
}: {
  data: number[];
  values: number[];
  name: string;
}) => {
  const svgRef = useRef(null);

  const [minMax, setMinMax] = useState([0, 100]);

  useEffect(() => {
    // Clear any existing chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Process the incoming data
    const processData = () => {
      // Map timestamps to date objects and values
      const dailyData = new Map();

      data.forEach((timestamp, index) => {
        const date = new Date(timestamp);
        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD format
        const value = Math.abs(values[index]);

        // If we already have an entry for this day, average the values
        if (dailyData.has(dateStr)) {
          const existing = dailyData.get(dateStr);
          existing.sum += value;
          // existing.count += 1;
          // existing.value = existing.sum / existing.count;
        } else {
          dailyData.set(dateStr, {
            date: date,
            sum: value,
            // count: 1,
            // value: value,
          });
        }
      });

      // Convert map to array
      return Array.from(dailyData.values()).sort((a, b) => a.date - b.date);
    };

    const processedData = processData();

    // Chart configuration
    const cellSize = 16; // height of a day
    const height = cellSize * 9; // height with padding for labels
    const width = cellSize * 53 + 60 + 200; // width with padding for labels

    // Define formatting functions
    const formatValue = d3.format("+.2%");
    const formatDate = d3.utcFormat("%x");
    const formatDay = (i) => "SMTWTFS"[i];
    const formatMonth = d3.utcFormat("%b");

    // Helpers for positioning
    const timeWeek = d3.timeSunday;
    const countDay = (i) => i; // 0 = Sunday, 1 = Monday, etc.

    // Compute color scale
    const max = d3.quantile(processedData, 0.9975, (d) => Math.abs(d.sum)) || 1;
    const color = d3.scaleSequential(d3.interpolatePiYG).domain([-max, +max]);

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
      .text(new Date(values[0]).getFullYear());

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
      .append("title")
      .text(
        (d) => `${formatDate(d.date)}
Value: ${d.sum.toFixed(2)}
Entries: ${d.count}`,
      );

    // Add month outlines and labels
    const months = year
      .append("g")
      .selectAll("g")
      .data(
        d3.timeMonths(
          new Date(new Date(values[0]).getFullYear(), 0, 1),
          new Date(new Date(values[0]).getFullYear() + 1, 0, 1),
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
    const legendX = width - legendWidth - 10;
    const legendY = height - 30;

    const min = d3.min(processedData, (d) => d.sum) || 0;
    const max22 = d3.max(processedData, (d) => d.sum) || 1;

    // console.log(name, [min, max]);
    setMinMax([min, max22]);

    const legendScale = d3
      .scaleLinear()
      .domain([min, max22])
      .range(["#ffffff", "#06D6A0"]);

    const legendAxis = d3
      .axisBottom(legendScale)
      .tickSize(6)
      .ticks(5)
      .tickFormat(formatValue);

    const legend = svg
      .append("g")
      //
      .attr("transform", `translate(${legendX}, ${legendY})`);

    const defs = svg.append("defs");

    const gradient = defs
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", color(-max));

    gradient.append("stop").attr("offset", "50%").attr("stop-color", color(0));

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", color(max));

    legend
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", 8)
      .style("fill", "url(#gradient)");

    legend.append("g").attr("transform", `translate(0, 8)`).call(legendAxis);

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", -6)
      .attr("font-weight", "bold")
      .text("Daily Change %");
  }, []);

  return (
    <div>
      <h2>
        {name}, [{minMax[0]}, {minMax[1].toFixed(2)}]
      </h2>
      <svg ref={svgRef} style={{ width: "100%" }}></svg>
    </div>
  );
};
