import { FC, useState } from "react";
import css from "./App.module.css";
import { Hello } from "./gen/hello/v1/hello_rsm_react";
// We can choose any id we want because the state will be constructed when we
// make the first .writer call.
const STATE_MACHINE_ID = "resemble-hello";

const Message: FC<{ text: string }> = ({ text }) => {
  return <div className={css.message}>{text}</div>;
};

const App = () => {
  // State of the input component.
  const [message, setMessage] = useState("Hello, Resemble!");

  const { useMessages } = Hello({ id: STATE_MACHINE_ID });
  const {
    response,
    mutations: { Send },
  } = useMessages();

  const handleClick = () => {
    Send({ message: message }).then(() => setMessage(""));
  };

  return (
    <div className={css.messages}>
      <input
        type="text"
        className={css.textInput}
        onChange={(e) => setMessage(e.target.value)}
        value={message}
        placeholder="<your message here>"
      />
      <button
        className={message === "" ? css.buttonDisabled : css.buttonEnabled}
        onClick={handleClick}
        disabled={message === ""}
      >
        Send
      </button>
      {response !== undefined &&
        response.messages.length > 0 &&
        response.messages.map((message: string) => (
          <Message text={message} key={message} />
        ))}
    </div>
  );
};

export default App;
