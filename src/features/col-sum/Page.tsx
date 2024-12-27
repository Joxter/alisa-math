import { createEffect, createEvent, createStore, sample } from "effector";
import { useUnit } from "effector-react";
import css from "./Page.module.css";
// import { ScrollDigit } from "./ScrollDigit.tsx";
import React from "react";
import { cn } from "../../utils.ts";

type Equation = {
  type: "add";
  a: number;
  b: number;
};

type Answer = [number | null, number | null, number | null];

let $equation = createStore<Equation | null>(null);
let $answer = createStore<Answer>([null, null, null]);

// let answerChanged = createEvent<string | number | null>();
let numClicked = createEvent<[number, 0 | 1 | 2]>();
let backClicked = createEvent();

let setEquation = createEvent<Equation>();
let submitted = createEvent();
let newClicked = createEvent();

let submitFx = createEffect((data: { eq: Equation | null; answer: Answer }) => {
  let { eq, answer } = data;

  if (!eq) {
    return { status: "error", message: "Не найден пример" } as const;
  }
  let ans = answer.map((n) => (n === null ? "" : String(n))).join("");
  if (!ans) {
    return { status: "error", message: "Введите ответ" } as const;
  }
  let answerNum = +ans;
  if (Number.isNaN(answerNum)) {
    return { status: "error", message: "Введите число" } as const;
  }

  if (eq.a + eq.b === answerNum) {
    return { status: "ok", message: "Ура! Это правильный ответ!" } as const;
  }

  return { status: "error", message: "Неправильный ответ" } as const;
});

$answer
  // .on(answerChanged, (cur, answer) => {
  //   if (answer === null) return null;
  //
  //   if (typeof answer === "string") {
  //     let num = parseInt(answer);
  //     if (Number.isNaN(num)) {
  //       return String(num);
  //     }
  //     return null;
  //   }
  //
  //   return cur;
  // })
  .on(numClicked, (cur, [n, i]) => {
    let newAns = [...cur] as Answer;
    newAns[i] = n;
    return newAns;
  })
  .on(newClicked, () => [null, null, null])
  .on(submitFx.doneData, (_, res) => {
    return res.status === "ok" ? [null, null, null] : _;
  });

$equation
  .on(setEquation, (_, equation) => equation)
  .on(newClicked, () => newEq())
  .on(submitFx.doneData, (_, res) => {
    if (res.status === "ok") {
      return newEq();
    }
    return _;
  });

submitFx.doneData.watch((res) => {
  alert(res.message);
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
      <div className={css.answer}>
        {answer.map((n) => {
          return <span>{n ?? "_"}</span>;
        })}
      </div>
      <div className={css.numpad}>
        {[0, 1, 3, 4, 5, 6, 7, 8, 9].map((n, i) => {
          return (
            <React.Fragment key={i}>
              <NumpadNum
                val={n}
                current={answer[0]}
                onClick={() => numClicked([n, 0])}
              />
              <NumpadNum
                val={n}
                current={answer[1]}
                onClick={() => numClicked([n, 1])}
              />
              <NumpadNum
                val={n}
                current={answer[2]}
                onClick={() => numClicked([n, 2])}
              />
            </React.Fragment>
          );
        })}
      </div>
      {/*
      <div>
        <ScrollDigit
          onChange={(n) => {
            console.log("onChange", n);
          }}
        />
      </div>
      */}
      <div className={css.footer}>
        <button type="submit" className={css.niceButton}>
          Принять
        </button>
        <button
          type="button"
          onClick={() => newClicked()}
          className={css.niceButtonLight}
        >
          Новый пример
        </button>
      </div>
    </form>
  );
}

function randomIntInRange(from: number, to: number) {
  return from + Math.floor(Math.random() * (to - from));
}

function newEq(): Equation {
  let a = [
    //
    randomIntInRange(1, 3),
    randomIntInRange(0, 9),
    randomIntInRange(6, 9),
  ].join("");

  let b = [
    //
    randomIntInRange(1, 9),
    randomIntInRange(0, 6),
  ].join("");

  return { type: "add", a: +a, b: +b };
}

function NumpadNum(props: {
  val: number;
  current: number | null;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        //
        css.niceButton,
        props.current === props.val && css.niceButtonCurrent,
      )}
      type="button"
      onClick={props.onClick}
    >
      {props.val}
    </button>
  );
}

function Nbsp() {
  return <span>&nbsp;</span>;
}
