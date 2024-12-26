import "./app.module.css";
import { Route, Switch } from "wouter";
import { NotFound } from "./pages/NotFound.tsx";
import { HomePage } from "./pages/HomePage.tsx";

let prefix =
  location.origin === "https://joxter.github.io"
    ? "/alisa-math/gh-pages/"
    : "/";

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
