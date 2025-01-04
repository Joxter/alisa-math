import "./app.module.css";
import { Link, Route, Router, Switch } from "wouter";
import { NotFound } from "./pages/NotFound.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { Layout } from "./pages/Layout.tsx";

let prefix =
  location.origin === "https://joxter.github.io"
    ? "/alisa-math/?"
    : "/";

function App() {
  // basename
  return (
    <Switch>
      <Route path={prefix + ""} component={HomePage} />
      <Route path={prefix + "/one"} component={One} />
      <Route path={prefix + "/two"} component={Two} />
      <Route path={prefix + "*"}>
        <NotFound />
      </Route>
    </Switch>
  );
}

export default App;

export function One() {
  return (
    <Layout>
      <p>ONE</p>
      <Link href={prefix + "/one"}>to one</Link>
      <Link href={prefix + "/two"}>to two</Link>
    </Layout>
  );
}

export function Two() {
  return (
    <Layout>
      <p>TWO</p>
      <Link href={prefix + "/one"}>to one</Link>
      <Link href={prefix + "/two"}>to two</Link>
    </Layout>
  );
}
