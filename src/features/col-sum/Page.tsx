import { createEffect, createEvent, createStore, sample } from "effector";
import { useUnit } from "effector-react";
import css from "./Page.module.css";
import React from "react";
import { cn } from "../../utils.ts";

type Equation = {
  type: "add";
  a: number;
  b: number;
};

type AnswerDigit = { n: number; status: null | "ok" | "error" };
type Answer = [AnswerDigit | null, AnswerDigit | null, AnswerDigit | null];

let $equation = createStore<Equation | null>(null);
let $answer = createStore<Answer>([null, null, null]);

let numClicked = createEvent<[number, 0 | 1 | 2]>();

let setEquation = createEvent<Equation>();
let submitted = createEvent();
let newClicked = createEvent();

let submitFx = createEffect((data: { eq: Equation | null; answer: Answer }) => {
  let { eq, answer } = data;

  if (!eq) {
    return { status: "error", message: "Не найден пример" } as const;
  }
  let ans = answer.map((n) => (n === null ? "" : String(n.n))).join("");
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

  let correctAns = String(eq.a + eq.b);

  let ansStatus = answer.map((d, i) => {
    if (d === null) return null;
    return d.n === +correctAns[i] ? "ok" : "error";
  });

  return { status: "error", message: "Неправильный ответ", ansStatus } as const;
});

$answer
  .on(numClicked, (cur, [n, i]) => {
    let newAns = [...cur] as Answer;
    newAns[i] = newAns[i]?.n === n ? null : { n, status: null };
    return newAns;
  })
  .on(newClicked, () => [null, null, null])
  .on(submitFx.doneData, (current, res) => {
    if (res.status === "error" && res.ansStatus) {
      let newAns = [...current] as Answer;
      res.ansStatus.forEach((status, i) => {
        if (status) {
          newAns[i] = { n: newAns[i]!.n, status };
        }
      });
      return newAns;
    }
  });

$equation
  .on(setEquation, (_, equation) => equation)
  .on(newClicked, () => newEq())
  .on(submitFx.doneData, (_, res) => {
    return _;
    // if (res.status === "ok") {
    //   return newEq();
    // }
  });

submitFx.doneData.watch((res) => {
  console.log(res.message);
});

let $modal = createStore(false);
let setShowModal = createEvent<boolean>();

$modal.on(setShowModal, (_, show) => show);

submitFx.doneData.watch((res) => {
  if (res.status === "ok") {
    setShowModal(true);
  }
});

sample({
  source: { eq: $equation, answer: $answer },
  clock: submitted,
  target: submitFx,
});

setEquation(newEq());

export function ColSum() {
  let [equation, answer, modal] = useUnit([$equation, $answer, $modal]);

  return (
    <form
      className={css.root}
      onSubmit={(ev) => {
        ev.preventDefault();
        submitted();
      }}
    >
      {modal && (
        <SuccessModal
          onClose={() => {
            setShowModal(false);
            newClicked();
          }}
        />
      )}

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
        {answer.map((d) => {
          let color = "";

          if (d && d.status !== null) {
            color = d.status === "ok" ? "" : "red";
          }
          return <span style={{ color }}>{d?.n ?? "_"}</span>;
        })}
      </div>
      <div className={css.numpad}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n, i) => {
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

export function newEq(): Equation {
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
  current: AnswerDigit | null;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        //
        css.niceButton,
        props.current?.n === props.val && css.niceButtonCurrent,
      )}
      type="button"
      onClick={props.onClick}
    >
      {props.val}
    </button>
  );
}

type SuccessModalProps = {
  onClose: () => void;
};

export function SuccessModal({ onClose }: SuccessModalProps) {
  return (
    <div className={css.modalOverlay}>
      <div className={css.modalContent}>
        <p>
          Ура!
          <br />
          Это правильный ответ!
        </p>
        <div>
          <button onClick={onClose} className={css.modalButton}>
            Еще пример
          </button>
        </div>
      </div>
    </div>
  );
}
