import "./app.module.css";
import { Link, Route, Router, Switch } from "wouter";
import { NotFound } from "./pages/NotFound.tsx";
import { Charts } from "./pages/Charts.tsx";
import { Layout } from "./pages/Layout.tsx";
import { prefix } from "./config.ts";
import { Excel } from "./pages/Excel.tsx";
import { Dashboards } from "./pages/Dashboards.tsx";

function App() {
  return (
    <Switch>
      <Route path={prefix + "/excel"} component={Excel} />
      <Route path={prefix + "/dashboard"} component={Dashboards} />
      <Route path={prefix + ""} component={Charts} />
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
