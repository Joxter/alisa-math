import React, { CSSProperties, ReactNode, useState } from "react";

const callWidth = 110;
const callHeight = 40;

const layoutStr = `
viz viz  pc  pc chart chart chart chart val
viz viz  pc  pc chart chart chart chart val
viz viz  ch dis chart chart chart chart val
viz viz  ch dis chart chart chart chart val
viz2 viz2  pc2  pc2  chart2 chart2 chart2 chart2 val2
viz2 viz2  pc2  pc2  chart2 chart2 chart2 chart2 val2
viz2 viz2  min2 max2 chart3 chart3 chart3 chart3 val2
viz2 viz2  cur2 avg2 chart3 chart3 chart3 chart3 val2
`.trim();

type Lay = {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

function layoutToGrid(layout: string): Lay[] {
  let processed: Record<string, Lay> = {};

  let grid = layout
    .trim()
    .split("\n")
    .map((line) => {
      return line.trim().split(/\s+/);
    });

  for (let i = 0; i < grid.length; i++) {
    let row = grid[i];

    for (let j = 0; j < row.length; j++) {
      let cell = row[j];

      if (!processed[cell]) {
        let width = 1;
        let jj = 1;
        while (row[j + jj] === cell) {
          width++;
          jj++;
        }

        let height = 1;
        let ii = 1;
        while (grid[i + ii]?.[j] === cell) {
          height++;
          ii++;
        }

        processed[cell] = {
          name: cell,
          w: width,
          h: height,
          x: j,
          y: i,
        };
      }
    }
  }

  return Object.values(processed);
}

export function Dashboards() {
  const boxes: Lay[] = layoutToGrid(layoutStr);

  gridToGroups(boxes, "v");

  return (
    <>
      <div>
        <pre>{layoutStr}</pre>
      </div>
      {/*
      <div>
        <pre>{gridToLayout(boxes)}</pre>
      </div>
      */}
      <Grid style={{ padding: "12px" }} cols={10} rows={10}>
        {boxes.map((it, i) => {
          const grid = {
            gridColumn: `${it.x + 1} / span ${it.w}`,
            gridRow: `${it.y + 1} / span ${it.h}`,
          };
          return (
            <div
              key={i}
              style={{
                background: "#fff",
                borderRadius: "2px",
                padding: "4px",
                fontVariantNumeric: "tabular-nums",
                ...grid,
              }}
            >
              {it.name === "avg" ? (
                <p style={{ fontSize: "11px", lineHeight: "1" }}>
                  Some very long label without any value
                </p>
              ) : (
                <Cell name={it.name} w={it.w} h={it.h} />
              )}
              {/*
              <div style={{ display: "flex", gap: "4px" }}>
                <p>x: {it.x}</p>
                <p>y: {it.y}</p>
                <p>w: {it.w}</p>
                <p>h: {it.h}</p>
              </div>
              <p style={{ wordBreak: "break-word" }}>{JSON.stringify(grid)}</p>
              */}
            </div>
          );
        })}
      </Grid>
    </>
  );
}

function Grid({
  cols,
  rows,
  children,
  style,
  background = "#e9e9e9",
}: {
  children: ReactNode;
  background?: string;
  style?: CSSProperties;
  cols: number;
  rows: number;
}) {
  return (
    <div
      style={{
        ...style,
        background,
        fontWeight: "10px",
        display: "grid",
        gap: "4px",
        gridTemplateColumns: `repeat(${cols}, ${callWidth}px)`,
        gridTemplateRows: `repeat(${rows}, ${callHeight}px)`,
      }}
    >
      {children}
    </div>
  );
}

function Cell({ name, w, h }: { name: string; w: number; h: number }) {
  return (
    <Grid cols={w} rows={h} background="transparent">
      {Array(w * h)
        .fill(0)
        .map((_, i) => {
          return (
            <div key={i}>
              <p style={{ fontSize: "11px", lineHeight: "1" }}>{name}</p>
              <p style={{ fontSize: "22px", lineHeight: "1" }}>
                {(Math.floor(Math.random() * 4999) - 2500) / 10}
                {<>&thinsp;</>}
                <span style={{ fontSize: "11px", lineHeight: "1" }}>kWh</span>
              </p>
            </div>
          );
        })}
    </Grid>
  );
}

function gridToGroups(grid: Lay[], dir: ">" | "v"): Array<string[]> {
  let layout = gridToLayout(grid)
    .split("\n")
    .map((it) => it.split(" "));

  let groups = [] as Array<string[]>;

  if (dir === ">") {
    let prevL = 0;
    let names = layout.map((it) => it[0]);

    for (let i = 1; i <= layout[0].length; i++) {
      if (layout.every((it) => it[i] !== it[i - 1])) {
        // console.log("GROUP!", prevL, i, [...new Set(names)]);
        groups.push([...new Set(names)]);
        names = [];
        prevL = i;
      }
      names.push(...layout.map((it) => it[i]));
    }
  } else {
    let prevT = 0;
    let names = [...layout[0]];

    for (let i = 1; i <= layout.length; i++) {
      if (
        Array(layout[0].length)
          .fill(0)
          .every((_, j) => {
            return layout[i]?.[j] !== layout[i - 1][j];
          })
      ) {
        // console.log("GROUP!", prevT, i, [...new Set(names)]);
        groups.push([...new Set(names)]);
        names = [];
        prevT = i;
      }
      names.push(
        ...Array(layout[0].length)
          .fill(0)
          .map((_, j) => layout[i]?.[j]),
      );
    }
  }

  // console.log({ dir });
  // console.log(groups.map((g) => g.join(" ")).join("\n"));

  return groups;
}

function gridToLayout(grid: Lay[]): string {
  let gridMap: Array<string[]> = [];

  grid.forEach((it) => {
    for (let i = 0; i < it.h; i++) {
      for (let j = 0; j < it.w; j++) {
        let cellX = it.x + j;
        let cellY = it.y + i;

        if (!gridMap[cellY]) gridMap[cellY] = [] as string[];
        gridMap[cellY][cellX] = it.name;
      }
    }
  });

  return gridMap.map((it) => it.join(" ")).join("\n");
}
