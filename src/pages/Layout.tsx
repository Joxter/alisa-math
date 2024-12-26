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
      <header className={css.header}>
        <div className={css.content}>Математика для Алисы</div>
      </header>
      <div className={contentClass || ""}>{children}</div>
      <footer className={css.footer}>
        <div className={css.content}>от папчика</div>
      </footer>
    </div>
  );
}
