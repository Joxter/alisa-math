import { createEffect, createEvent, createStore, sample } from "effector";
import { useUnit } from "effector-react";
import css from "./Page.module.css";
import React from "react";
import { Link } from "wouter";
import { prefix } from "../../config.ts";

type Equation = {
  type: "add";
  a: number;
  b: number;
};

type AnswerDigit = { n: number; status: null | "ok" | "error" };
type Answer = [AnswerDigit | null, AnswerDigit | null, AnswerDigit | null];

let $equation = createStore<Equation | null>(null);
let $answer = createStore<Answer>([null, null, null]);
let $caret = createStore(2);
let $initCaret = createStore(2);

let numClicked = createEvent<number | null>();

let setEquation = createEvent<Equation>();
let submitted = createEvent();
let newClicked = createEvent();
let caretClick = createEvent<number>();

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
  // .on(numClicked, (cur, [n, i]) => {
  //   let newAns = [...cur] as Answer;
  //   newAns[i] = newAns[i]?.n === n ? null : { n, status: null };
  //   return newAns;
  // })
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

let moveCaretFx = createEffect(
  (props: {
    answer: Answer | null;
    cur: number;
    num: number | null;
  }): Promise<number> => {
    return new Promise((resolve) => {
      if (!props.answer) return resolve(props.cur);
      if (props.num === null) return resolve(props.cur);

      let { answer, cur } = props;

      if (answer[cur + 1] === null) {
        setTimeout(() => resolve((cur + 1) % 3), 4);
      } else if (answer[cur - 1] === null) {
        setTimeout(() => resolve(cur - 1), 4);
      }
    });
  },
);

sample({
  source: [$initCaret, $answer] as const,
  clock: caretClick,
  fn: ([initCaret, ans], click) => {
    if (ans.every((it) => it === null)) {
      return click;
    }

    return initCaret;
  },

  target: $initCaret,
});

sample({ source: $initCaret, clock: newClicked, target: $caret });

$caret
  //
  .on(moveCaretFx.doneData, (_, next) => next)
  .on(caretClick, (_, c) => c);

sample({
  source: [$answer, $caret] as const,
  clock: numClicked,
  fn: ([cur, caret], n) => {
    let newAns = [...cur] as Answer;
    newAns[caret] =
      n === null || newAns[caret]?.n === n ? null : { n, status: null };
    return newAns;
  },
  target: $answer,
});

sample({
  source: { cur: $caret, answer: $answer },
  clock: numClicked,
  fn: (d, num) => ({ ...d, num }),
  target: moveCaretFx,
});

setEquation(newEq());

export function ColSum() {
  let [equation, answer, modal, caret] = useUnit([
    $equation,
    $answer,
    $modal,
    $caret,
  ]);

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
      <div className={css.answerCont}>
        <button
          onClick={() => {
            alert(Math.random() > 0.5 ? "Я тебя люблю" : "I love you");
          }}
          className={css.niceButton}
        >
          ❤️
        </button>
        <div className={css.answer}>
          {answer.map((d, i) => {
            let color = "";

            if (d && d.status !== null) {
              color = d.status === "ok" ? "" : "red";
            }
            return (
              <span
                className={css.ansNum}
                onClick={() => {
                  caretClick(i);
                }}
                style={{
                  color,
                  gridColumn: `${i + 1} / ${i + 2}`,
                  gridRow: `1 / 2`,
                }}
              >
                {d?.n ?? "_"}
              </span>
            );
          })}
          <span
            className={css.caret}
            style={{
              transform: `translateX(${caret * 30 + (caret - 1) * 2}px)`,
              gridColumn: `1 / 2`,
            }}
          ></span>
        </div>
      </div>
      <div className={css.numpad}>
        <NumpadNum val={1} onClick={() => numClicked(1)} />
        <NumpadNum val={2} onClick={() => numClicked(2)} />
        <NumpadNum val={3} onClick={() => numClicked(3)} />
        <NumpadNum val={4} onClick={() => numClicked(4)} />
        <NumpadNum val={5} onClick={() => numClicked(5)} />
        <NumpadNum val={6} onClick={() => numClicked(6)} />
        <NumpadNum val={7} onClick={() => numClicked(7)} />
        <NumpadNum val={8} onClick={() => numClicked(8)} />
        <NumpadNum val={9} onClick={() => numClicked(9)} />
        <NumpadNum val={"X"} onClick={() => numClicked(null)} />
        <NumpadNum val={0} onClick={() => numClicked(0)} />
        <NumpadNum val={"="} onClick={() => submitted()} />
      </div>
      <div className={css.footer}>
        <button
          type="button"
          onClick={() => newClicked()}
          className={css.niceButtonLight}
        >
          Новый пример
        </button>
      </div>
      <Link href={prefix + "/one"} style={{ opacity: "0.1" }}>
        to one
      </Link>
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

function NumpadNum(props: { val: number | string; onClick: () => void }) {
  return (
    <button className={css.niceButton} type="button" onClick={props.onClick}>
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
