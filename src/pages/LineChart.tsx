import React, { useMemo } from "react";
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

export function LineChart({
  calcData,
  day,
  lastKeys,
}: {
  calcData: any;
  lastKeys: any;
  day: Date;
}) {
  const dayDate = useMemo(() => {
    if (day) {
      let res = extractDayData(calcData, day);

      res.date = res.date.map((it) => {
        return new Date(it).toISOString().slice(11, 16);
      });
      return res;
    }

    return null;
  }, [calcData, day]);

  return (
    <Line
      options={options}
      data={{
        labels: dayDate.date,
        datasets: lastKeys.map((key, i) => {
          let item = {
            label: key,
            data: dayDate[key],
            borderColor: colors[i],
            // hidden: true,
          };
          return item;
        }),
      }}
    />
  );
}

const extractDayData = (
  yearData: Record<string, number[]>,
  targetDate: Date,
) => {
  // Exit early if data is invalid
  if (!yearData || !yearData.date || !targetDate) {
    return { date: null, timestamps: [] };
  }

  // Get the date string in YYYY-MM-DD format for comparison
  const targetDateStr = targetDate.toISOString().split("T")[0];

  // Get all the keys from the yearData object except 'date'
  const dataKeys = Object.keys(yearData).filter((key) => key !== "date");

  // Initialize the result object
  const result = {
    date: [],
  };

  dataKeys.forEach((key) => {
    result[key] = [];
  });

  // Filter the data to only include entries from the target date
  yearData.date.forEach((timestamp, index) => {
    const date = new Date(timestamp);
    const dateStr = date.toISOString().split("T")[0];

    // If this timestamp is from the target date, include it
    if (dateStr === targetDateStr) {
      result.date.push(timestamp);

      // Process each data key
      dataKeys.forEach((key) => {
        if (yearData[key] && yearData[key][index] !== undefined) {
          const value = yearData[key][index];

          // Add the value to the result
          result[key].push(value);
        }
      });
    }
  });

  return result;
};
