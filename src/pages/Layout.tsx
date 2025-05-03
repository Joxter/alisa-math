import css from "./Layout.module.css";
import { PropsWithChildren } from "react";
// import { useRoute } from "wouter";

type Props = PropsWithChildren<{
  contentClass?: string | null;
}>;

export function Layout({ children, contentClass }: Props) {
  // const [isLogin] = useRoute("/login");

  return (
    <div className={css.root}>
      <div className={contentClass || ""}>{children}</div>
    </div>
  );
}
