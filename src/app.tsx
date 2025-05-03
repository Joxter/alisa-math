import "./app.module.css";
import { Link, Route, Router, Switch } from "wouter";
import { NotFound } from "./pages/NotFound.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { Layout } from "./pages/Layout.tsx";
import { prefix } from "./config.ts";

function App() {
  return (
    <Switch>
      <Route path={prefix + ""} component={HomePage} />
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
      <p>
        <Link href={prefix + "/one"}>to one</Link>
      </p>
      <p>
        <Link href={prefix + "/two"}>to two</Link>
      </p>
    </Layout>
  );
}

export function Two() {
  return (
    <Layout>
      <p>TWO</p>
      <p>
        <Link href={prefix + "/one"}>to one</Link>
      </p>
      <p>
        <Link href={prefix + "/two"}>to two</Link>
      </p>
    </Layout>
  );
}
