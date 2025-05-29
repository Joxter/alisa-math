import React, {
  CSSProperties,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

const cellWidth = 110;
const cellHeight = 40;

const gap = 4;
const gridPadding = 12;

const borderRadius = 2;
const cellPadding = 2;

const timeSeries = ["1", "2", "3", "7", "f"];
// const timeSeries = ["chart", "chart1", "chart2", "chart3", "chart5"];

// const layoutStr = `
// viz viz  pc  pc chart chart chart chart val
// viz viz  pc  pc chart chart chart chart val
// viz viz  ch dis chart chart chart chart val
// viz viz  ch dis chart chart chart chart val
// viz2 viz2  pc2  pc2  chart2 chart2 chart2 chart2 val2
// viz2 viz2  pc2  pc2  chart2 chart2 chart2 chart2 val2
// viz2 viz2  min2 max2 chart3 chart3 chart3 chart3 val2
// viz2 viz2  cur2 avg2 chart3 chart3 chart3 chart3 val2
// `.trim();

const layoutStr = `
viz viz  pc  pc chart chart chart chart val
viz viz  pc  pc chart chart chart chart val
viz viz  ch dis chart chart chart chart val
viz viz  ch dis chart chart chart chart val
// chart5 chart5 chart5 chart5 chart5 chart5 chart5 chart5 chart5
// chart5 chart5 chart5 chart5 chart5 chart5 chart5 chart5 chart5
// chart5 chart5 chart5 chart5 chart5 chart5 chart5 chart5 chart5
// chart5 chart5 chart5 chart5 chart5 chart5 chart5 chart5 chart5
viz1 viz1  pc1  pc1 chart1 chart1 chart1 chart1 val1
viz1 viz1  pc1  pc1 chart1 chart1 chart1 chart1 val1
viz1 viz1  ch1 dis1 chart1 chart1 chart1 chart1 val1
viz1 viz1  ch1 dis1 chart1 chart1 chart1 chart1 val1
viz2 viz2  pc2  pc2 chart2 chart2 chart2 chart2 val2
viz2 viz2  pc2  pc2 chart2 chart2 chart2 chart2 val2
viz2 viz2  ch2 dis2 chart2 chart2 chart2 chart2 val2
viz2 viz2  ch2 dis2 chart2 chart2 chart2 chart2 val2
viz3 viz3  pc3  pc3 chart3 chart3 chart3 chart3 val3
viz3 viz3  pc3  pc3 chart3 chart3 chart3 chart3 val3
viz3 viz3  ch3 dis3 chart3 chart3 chart3 chart3 val3
viz3 viz3  ch3 dis3 chart3 chart3 chart3 chart3 val3
`.trim();

// const layoutStr = `
// a d e e k l m 1 1 1 z
// b d f g k 2 2 2 2 2 y
// c d h h 3 3 n o o p p
// 0 0 0 9 9 9 8 8 8 8 7
// `.trim();

// const layoutStr = `
// d e k l m 1 1 1 z
// d f k 2 2 2 2 2 y
// d h 3 3 n o o p p
// 0 0 9 9 8 8 8 8 7
// `.trim();

// const layoutStr = `
// d k l 1 z
// d k 2 2 y
// d 3 3 p p
// 0 9 9 8 7
// `.trim();

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
    .filter((line) => {
      return !line.trim().startsWith("//");
    })
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

  const context: Context = {
    visited: [] as string[],
    timeSeries,
    lefty: [] as string[],
    righty: [] as string[],
  };
  const griddd = gridToLayout(boxes)
    .trim()
    .split("\n")
    .map((line) => {
      return line.trim().split(/\s+/);
    });

  griddd.forEach((_, i) => {
    // if (!context.timeSeries.includes([i, 0].join("|"))) {
    markLefty(griddd, [i, 0], context);
    // }
  });
  griddd.forEach((_, i) => {
    // if (!context.timeSeries.includes([i, griddd[0].length - 1].join("|"))) {
    markRighty(griddd, [i, griddd[0].length - 1], context);
    // }
  });

  return (
    <div
      style={{
        minWidth:
          griddd[0].length * cellWidth +
          gridPadding * 2 +
          (griddd[0].length - 1) * gap,
        border: "1px solid red",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div>
        <pre>{layoutStr}</pre>
      </div>
      <h2>
        <br />
        Static
      </h2>
      <Grid
        style={{ padding: gridPadding + "px" }}
        cols={griddd[0].length}
        rows={griddd.length}
      >
        {boxes.map((it, i) => {
          const grid = {
            gridColumn: `${it.x + 1} / span ${it.w}`,
            gridRow: `${it.y + 1} / span ${it.h}`,
          };
          return (
            <div
              key={i}
              style={{
                background: context.lefty.includes(it.name)
                  ? "#c0cdf4"
                  : context.righty.includes(it.name)
                    ? "#d3f4c0"
                    : context.timeSeries.includes(it.name)
                      ? "#fff"
                      : "red",
                borderRadius: borderRadius + "px",
                padding: cellPadding + "px",
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
            </div>
          );
        })}
      </Grid>
      <h2>
        <br />
        Wide
      </h2>
      <Grid
        style={{ padding: gridPadding + "px" }}
        cols={griddd[0].length}
        elastic
        rows={griddd.length}
      >
        {boxes.map((it, i) => {
          const grid = {
            gridColumn: `${it.x + 1} / span ${it.w}`,
            gridRow: `${it.y + 1} / span ${it.h}`,
          };
          return (
            <div
              key={i}
              style={{
                background: context.lefty.includes(it.name)
                  ? "#c0cdf4"
                  : context.righty.includes(it.name)
                    ? "#d3f4c0"
                    : context.timeSeries.includes(it.name)
                      ? "#fff"
                      : "red",
                borderRadius: borderRadius + "px",
                padding: cellPadding + "px",
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
            </div>
          );
        })}
      </Grid>
      <h2>
        <br />
        Wide charts
      </h2>

      <div
        style={{
          padding: gridPadding + "px",
          height: griddd.length * (cellHeight + gap) + gridPadding * 2,
          position: "relative",
          background: "#eed5f3",
        }}
      >
        {boxes.map((it, i) => {
          const rightI = griddd[0].length - (it.x + it.w);

          return (
            <div
              key={i}
              style={{
                background: context.lefty.includes(it.name)
                  ? "#c0cdf4"
                  : context.righty.includes(it.name)
                    ? "#d3f4c0"
                    : context.timeSeries.includes(it.name)
                      ? "#fff"
                      : "red",
                borderRadius: borderRadius + "px",
                padding: gap + "px",
                position: "absolute",
                ...(context.lefty.includes(it.name)
                  ? {
                      left:
                        gridPadding + (it.x * cellWidth + it.x * gap) + "px",
                      top:
                        gridPadding + (it.y * cellHeight + it.y * gap) + "px",
                      width: it.w * cellWidth + (it.w - 1) * gap + "px",
                      height: it.h * cellHeight + (it.h - 1) * gap + "px",
                    }
                  : context.righty.includes(it.name)
                    ? {
                        right:
                          gridPadding +
                          (rightI * cellWidth + rightI * gap) +
                          "px",
                        top:
                          gridPadding + (it.y * cellHeight + it.y * gap) + "px",
                        width: it.w * cellWidth + (it.w - 1) * gap + "px",
                        height: it.h * cellHeight + (it.h - 1) * gap + "px",
                      }
                    : {
                        left:
                          gridPadding + (it.x * cellWidth + it.x * gap) + "px",
                        right:
                          gridPadding +
                          (rightI * cellWidth + rightI * gap) +
                          "px",
                        top:
                          gridPadding + (it.y * cellHeight + it.y * gap) + "px",
                        height: it.h * cellHeight + (it.h - 1) * gap + "px",
                      }),
              }}
            >
              {it.name === "avg" ? (
                <p style={{ fontSize: "11px", lineHeight: "1" }}>
                  Some very long label without any value
                </p>
              ) : (
                <Cell name={it.name} w={it.w} h={it.h} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Grid({
  cols,
  rows,
  children,
  elastic,
  style,
  background = "#e9e9e9",
}: {
  children: ReactNode;
  background?: string;
  elastic?: boolean;
  style?: CSSProperties;
  cols: number;
  rows: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(cellWidth);

  useEffect(() => {
    if (!elastic || !rootRef.current) return;

    const updateWidth = () => {
      const ww = rootRef.current!.getClientRects()[0].width;
      console.log(ww);
      console.log(ww / cols);
      setW((ww - 2 * gridPadding - (cols - 1) * gap) / cols);
    };

    // Initial calculation
    updateWidth();

    // Set up ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    resizeObserver.observe(rootRef.current);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, [elastic, cols, gridPadding, gap]); // Add dependencies that affect the calculation

  return (
    <div
      ref={rootRef}
      style={{
        ...style,
        background,
        display: "grid",
        gap: gap,
        gridTemplateColumns: `repeat(${cols}, ${w}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellHeight}px)`,
      }}
    >
      {children}
    </div>
  );
}

function randomChart(length = 10) {
  // Various Unicode symbols for different chart styles
  const symbols = [
    ...["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"], // Block elements
    ...["_", "▁", "▂", "▃", "▄", "▅", "▆", "▇"], // Ascending blocks
    ...["▒", "▓", "█", "█", "█", "█", "█"], // Shading
  ];

  // Pick a random symbol set
  const symbolSet = symbols;

  // Generate random values and map to symbols
  const chart = Array.from({ length }, () => {
    const value = Math.floor(Math.random() * symbolSet.length);
    return symbolSet[value];
  }).join("");

  return chart;
}

function Cell({ name, w, h }: { name: string; w: number; h: number }) {
  if (timeSeries.includes(name)) {
    return (
      <div style={{ overflow: "hidden" }}>
        <p style={{ fontSize: "11px", lineHeight: "1" }}>{name}</p>
        <p style={{ fontSize: "22px", lineHeight: "1" }}>{randomChart(100)}</p>
      </div>
    );
  }

  return (
    <Grid cols={w} rows={h} background="transparent">
      {Array(1) // w * h
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

type Context = {
  timeSeries: string[];
  visited: string[];
  lefty: string[];
  righty: string[];
};

function markLefty(
  grid: Array<string[]>,
  current: [number, number],
  context: Context,
) {
  if (context.visited.includes(current.join("|"))) return;
  let cell = grid[current[0]]?.[current[1]];
  if (!cell) return;

  context.visited.push(current.join("|"));
  context.lefty.push(cell);

  let rightCell = grid[current[0]][current[1] + 1];
  let leftCell = grid[current[0]][current[1] - 1];
  let downCell = grid[current[0] + 1]?.[current[1]];
  let upCell = grid[current[0] - 1]?.[current[1]];

  if (!context.timeSeries.includes(rightCell)) {
    markLefty(grid, [current[0], current[1] + 1], context);
  }

  markLefty(grid, [current[0], current[1] - 1], context);

  if (cell === downCell) {
    markLefty(grid, [current[0] + 1, current[1]], context);
  }
  if (cell === upCell) {
    markLefty(grid, [current[0] - 1, current[1]], context);
  }
}

function markRighty(
  grid: Array<string[]>,
  current: [number, number],
  context: Context,
) {
  if (context.visited.includes(current.join("|"))) return;
  if (context.lefty.includes(current.join("|"))) return;
  if (context.righty.includes(current.join("|"))) return;

  let cell = grid[current[0]]?.[current[1]];
  if (!cell) return;
  if (context.timeSeries.includes(cell)) return;

  context.visited.push(current.join("|"));
  context.righty.push(cell);

  let rightCell = grid[current[0]][current[1] + 1];
  let leftCell = grid[current[0]][current[1] - 1];
  let downCell = grid[current[0] + 1]?.[current[1]];
  let upCell = grid[current[0] - 1]?.[current[1]];

  if (!context.timeSeries.includes(leftCell)) {
    markRighty(grid, [current[0], current[1] - 1], context);
  }

  markRighty(grid, [current[0], current[1] + 1], context);

  if (cell === downCell) {
    markRighty(grid, [current[0] + 1, current[1]], context);
  }
  if (cell === upCell) {
    markRighty(grid, [current[0] - 1, current[1]], context);
  }
}
