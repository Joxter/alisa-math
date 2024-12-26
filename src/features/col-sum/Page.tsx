import { createEffect, createEvent, createStore, sample } from "effector";
import { useUnit } from "effector-react";
import css from "./Page.module.css";

type Equation = {
  type: "add";
  a: number;
  b: number;
};

let $equation = createStore<Equation | null>(null);
let $answer = createStore<string>("");

let answerChanged = createEvent<string>();
let setEquation = createEvent<Equation>();
let submitted = createEvent();
let newClicked = createEvent();

let submitFx = createEffect((data: { eq: Equation | null; answer: string }) => {
  // console.log("submit", data);

  let { eq, answer } = data;

  if (!eq) {
    return { status: "error", message: "no equation" } as const;
  }

  let answerNum = +answer.trim();

  if (eq.a + eq.b === answerNum) {
    return { status: "ok" } as const;
  }

  return { status: "error", message: "Wrong answer :(" } as const;
});

$answer
  .on(answerChanged, (_, answer) => {
    console.log("----", answer);
    return answer;
  })
  .on(submitFx.doneData, (_, res) => {
    // console.log("submitFx.doneData");
    return res.status === "ok" ? "" : _;
  });

$equation
  .on(setEquation, (_, equation) => equation)
  .on(submitFx.doneData, (_, res) => {
    if (res.status === "ok") {
      return newEq();
    }
    return _;
  });

submitFx.doneData.watch((res) => {
  if (res.status === "ok") {
    alert("Correct!");
  } else {
    alert(res.message);
  }
});

sample({
  source: { eq: $equation, answer: $answer },
  clock: submitted,
  target: submitFx,
});

setEquation(newEq());

export function ColSum() {
  let [equation, answer] = useUnit([$equation, $answer]);

  return (
    <form
      className={css.root}
      onSubmit={(ev) => {
        ev.preventDefault();
        submitted();
      }}
    >
      {equation ? (
        <div className={css.equation}>
          <span className={css.plus}>+</span>
          <p>{equation.a}</p>
          <p>{equation.b}</p>
        </div>
      ) : (
        <p>no equation</p>
      )}
      <hr />
      <div className={css.input}>
        <input
          value={answer}
          onChange={(ev) => {
            if (ev.target.value) {
              let int = parseInt(ev.target.value);
              // console.log(int);

              if (int) {
                answerChanged(String(int));
              }
              return;
            }
            answerChanged("");
          }}
        />
        <button type="submit">Ok</button>
        <button type="button" onClick={newClicked}>
          New
        </button>
      </div>
    </form>
  );
}

function newEq(): Equation {
  return {
    type: "add",
    a: 100 + Math.floor(Math.random() * 100),
    b: Math.floor(Math.random() * 150),
  };
}
