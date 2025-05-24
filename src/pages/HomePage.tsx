import React, { useState } from "react";
// import calcData from "./calculationPS_small.json";
import calcData from "./calculationPS_small (2).json";
import { CalendarHeatmap } from "./HeatMap.tsx";
import { LineChart } from "./LineChart.tsx";

const bad = [
  "date",
  "redelivery_after_battery [kWh]",
  "curtailment_after_battery [kWh]",
  "consumption [kWh]",
  "consumption_from_grid_after_battery [kWh]",
  "optimized_exceeded_grid_values [kW]",
];

const keys = Object.keys(calcData).filter((it) => !bad.includes(it));

const lastKeys = [
  "consumption_from_grid_before_battery [kWh]",
  "battery_usage [kW]",
  "battery_state_of_charge [%]",
  "generator_capacity [kWh]",
  "power_from_grid_after_battery [kW]",
  "power_from_grid_after_generator [kW]",
];

const battery_usage_abs = calcData["battery_usage [kW]"].map((it) =>
  Math.abs(it),
);
const consumption_x4 = calcData[
  "consumption_from_grid_before_battery [kWh]"
].map((it) => it * 4);

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
  const [highlightDate, setHighlightDate] = useState(null);
  // const [threshold, setThreshold] = useState(890);
  const [threshold, setThreshold] = useState(155);

  function dayOf(date?: any) {
    return date && date.date.toISOString().split("T")[0];
  }

  return (
    <div style={{ display: "grid", gap: "12px", padding: "50px" }}>
      <div style={{ width: "500px", display: "grid" }}>
        <p>threshold: {threshold}</p>
        <input
          type="range"
          min="0"
          max="1000"
          value={threshold}
          onChange={(e) => {
            setThreshold(+e.target.value);
          }}
        />
      </div>
      <div style={{ width: "500px", display: "grid" }}>
        <p>
          highlightDate:{" "}
          {highlightDate && highlightDate.date.toISOString().split("T")[0]}
        </p>
      </div>
      <CalendarHeatmap
        name={"consumption_from_grid_before_battery [kWh]"}
        data={calcData["date"]}
        values={calcData["consumption_from_grid_before_battery [kWh]"]}
        threshold={threshold / 4}
        color="#0bb4ff"
        highlightDate={dayOf(highlightDate)}
        onSelect={setHighlightDate}
      />
      <CalendarHeatmap
        name={"battery_usage [kW]"}
        data={calcData["date"]}
        values={battery_usage_abs}
        threshold={null}
        highlightDate={dayOf(highlightDate)}
        onSelect={setHighlightDate}
      />
      <CalendarHeatmap
        name={"generator_capacity [kWh]"}
        data={calcData["date"]}
        values={calcData["generator_capacity [kWh]"]}
        threshold={null}
        color="#dc0ab4"
        highlightDate={dayOf(highlightDate)}
        onSelect={setHighlightDate}
      />
      <CalendarHeatmap
        name={"power_from_grid_after_generator [kW]"}
        data={calcData["date"]}
        values={calcData["power_from_grid_after_generator [kW]"]}
        threshold={threshold}
        color="#0bb4ff"
        highlightDate={dayOf(highlightDate)}
        onSelect={setHighlightDate}
      />
      <div style={{ width: "1200px" }}>
        {highlightDate && (
          <LineChart
            calcData={calcData}
            lastKeys={lastKeys}
            day={highlightDate?.date}
          />
        )}
      </div>
      {/*
      <div style={{ width: "1200px" }}>
        <LineChart calcData={calcData} lastKeys={keys} />
      </div>
      */}
    </div>
  );
}

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
