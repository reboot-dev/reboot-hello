import { FC, useState } from "react";
import { Greeter } from "../../api/hello_world/v1/greeter_rsm_react";
import css from "./App.module.css";
// We can choose any id we want because the state will be constructed when we
// make the first .writer call.
const GREETER_ID = "greeter-hello-world";

const Greeting: FC<{ text: string }> = ({ text }) => {
  return <div className={css.greeting}>{text}</div>;
};

const App = () => {
  // State of the input component.
  const [greetingMessage, setGreetingMessage] = useState("Hello, Resemble!");

  const { useGreetings } = Greeter({ id: GREETER_ID });
  const {
    response,
    mutations: { Greet },
  } = useGreetings();

  const handleClick = () => {
    Greet({ greeting: greetingMessage }).then(() => setGreetingMessage(""));
  };

  return (
    <div className={css.greetings}>
      <input
        type="text"
        className={css.textInput}
        onChange={(e) => setGreetingMessage(e.target.value)}
        value={greetingMessage}
      />
      <button className={css.button} onClick={handleClick}>
        Greet
      </button>
      {response !== undefined &&
        response.greetings.length > 0 &&
        response.greetings.map((greeting: string) => (
          <Greeting text={greeting} key={greeting} />
        ))}
    </div>
  );
};

export default App;
