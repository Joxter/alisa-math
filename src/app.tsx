import "./app.module.css";
import { Route, Switch } from "wouter";
import { NotFound } from "./pages/NotFound.tsx";
import { HomePage } from "./pages/HomePage.tsx";

function App() {
  return (
    <Switch>
      <Route path={"/"} component={HomePage} />
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

export default App;
