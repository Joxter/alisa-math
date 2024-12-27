import css from "./ScrollDigit.module.css";
import { useEffect, useRef } from "react";

const nums = "0123456789"
  .repeat(30)
  .split("")
  .map((it) => +it);

type Props = {
  onChange: (n: number) => void;
};

export function ScrollDigit({ onChange }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log(rootRef.current);

    rootRef.current!.addEventListener("scrollend", (ev) => {
      let scrollPosition = rootRef.current?.scrollTop || 0;
      let fullHeight = rootRef.current?.scrollHeight || 0;

      // let currentNum = Math.floor(scrollPosition / 20);

      console.log("end", scrollPosition, fullHeight);
    });
  }, []);

  return (
    <div className={css.root} ref={rootRef}>
      <div className={css.frame}>
        <div className={css.cont}>
          {nums.map((n, i) => {
            return (
              <span key={i} className={css.num}>
                {n}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
