import { createEffect, createEvent, createStore, sample } from "effector";
import { useUnit } from "effector-react";
import css from "./Page.module.css";

type Equation = {
  type: "add";
  a: number;
  b: number;
};

let $equation = createStore<Equation | null>(null);
let $answer = createStore<string | null>(null);

let answerChanged = createEvent<string | number | null>();
let numClicked = createEvent<number>();
let backClicked = createEvent();

let setEquation = createEvent<Equation>();
let submitted = createEvent();
let newClicked = createEvent();

let submitFx = createEffect(
  (data: { eq: Equation | null; answer: string | null }) => {
    let { eq, answer } = data;

    if (!eq) {
      return { status: "error", message: "Не найден пример" } as const;
    }
    if (answer === null) {
      return { status: "error", message: "Введите ответ" } as const;
    }
    let answerNum = +answer;
    if (Number.isNaN(answerNum)) {
      return { status: "error", message: "Введите число" } as const;
    }

    if (eq.a + eq.b === answerNum) {
      return { status: "ok", message: "Ура! Это правильный ответ!" } as const;
    }

    return { status: "error", message: "Неправильный ответ" } as const;
  },
);

$answer
  .on(answerChanged, (cur, answer) => {
    if (answer === null) return null;

    if (typeof answer === "string") {
      let num = parseInt(answer);
      if (Number.isNaN(num)) {
        return String(num);
      }
      return null;
    }

    return cur;
  })
  .on(numClicked, (cur, n) => {
    if (cur === null) return String(n);
    if (cur.length >= 3) return "999";

    return n + cur;
  })
  .on(backClicked, (cur) => {
    if (cur === null) return null;
    if (cur.length === 1) return null;

    return cur.slice(1);
  })
  .on(newClicked, () => null)
  .on(submitFx.doneData, (_, res) => {
    return res.status === "ok" ? null : _;
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
        <span
          style={{
            display: answer === "999" ? "none" : "",
          }}
          className={css.cursorAnimation}
        >
          _
        </span>
        {answer}
      </div>
      <div className={css.numpad}>
        <NumpadNum val="1" onClick={() => numClicked(1)} />
        <NumpadNum val="2" onClick={() => numClicked(2)} />
        <NumpadNum val="3" onClick={() => numClicked(3)} />
        <NumpadNum val="4" onClick={() => numClicked(4)} />
        <NumpadNum val="5" onClick={() => numClicked(5)} />
        <NumpadNum val="6" onClick={() => numClicked(6)} />
        <NumpadNum val="7" onClick={() => numClicked(7)} />
        <NumpadNum val="8" onClick={() => numClicked(8)} />
        <NumpadNum val="9" onClick={() => numClicked(9)} />
        <NumpadNum
          val="❤️"
          onClick={() => {
            alert("Я тебя люблю!");
          }}
        />
        <NumpadNum val="0" onClick={() => numClicked(0)} />
        <NumpadNum val="<" onClick={() => backClicked()} />
      </div>
      {/*
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

function NumpadNum(props: { val: string; onClick: () => void }) {
  return (
    <button className={css.niceButton} type="button" onClick={props.onClick}>
      {props.val}
    </button>
  );
}

function Nbsp() {
  return <span>&nbsp;</span>;
}
