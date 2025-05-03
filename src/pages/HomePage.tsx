import { Layout } from "./Layout.tsx";
import React from "react";
import calcData from "./calculationPS_small.json";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export const options: ChartOptions = {
  responsive: true,
  animation: false,
  aspectRatio: 3,
  // animation: false,
  scales: {
    // x: { type: "timeseries" },
  },
  interaction: { intersect: false },
  // "samples-filler-analyser": {
  //   target: "chart-analyser",
  // },
  plugins: {
    legend: { position: "top" as const },
    filler: { propagate: false },
    title: { display: true, text: "Chart.js Line Chart" },
  },
};

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

// const ok = [
// "consumption [kWh]",
// "net_from_grid [kWh]",
// "consumption_from_grid_before_battery [kWh]",
// "consumption_from_grid_after_battery [kWh]",
// "consumption_covered_by_battery [kWh]",
// "power_from_grid_after_generator [kW]",
// ];

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

// const limit = 100;
// const limit = 500;
const limit = 1000;
// const limit = 10_000;
// const limit = calcData.date.length;

const data = {
  labels: calcData.date.slice(0, limit),
  datasets: keys.map((key, i) => {
    let item = {
      label: key,
      data: calcData[key].slice(0, limit),
      borderColor: colors[i],
      hidden: true,
    };
    console.log(item);

    return item;
  }),
};

export function HomePage() {
  return (
    <Layout>
      <div
        style={{
          height: "400px",
          width: "100%",
        }}
      >
        <Line options={options} data={data} />{" "}
      </div>
    </Layout>
  );
}
