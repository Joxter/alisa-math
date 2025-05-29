import React, { CSSProperties, ReactNode, useState } from "react";

const callWidth = 110;
const callHeight = 40;

const layoutStr = `
viz viz  pc  pc chart chart chart chart val current
viz viz  pc  pc chart chart chart chart val avg
viz viz  ch dis chart chart chart chart val max
viz viz  ch dis chart chart chart chart val min
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

  return (
    <>
      <div>
        <pre>{layoutStr}</pre>
      </div>
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
        .map(() => {
          return (
            <div>
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
