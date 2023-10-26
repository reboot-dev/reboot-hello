import { KeyboardEvent, useRef, useState } from "react";
import css from "./ChatBox.module.css";

function ChatBox({ postMessage = (message: string) => {} }) {
  const [inputState, setInputState] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleChange = (inputText: string) => {
    setInputState(inputText);
  };

  const adjustTextArea = () => {
    if (ref && ref.current) {
      ref.current.style.height = "1px";
      ref.current.style.height = 25 + ref.current.scrollHeight + "px";
    }
  };

  const handleClick = () => {
    setInputState("");
    postMessage(inputState);
  };

  const handleEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      handleClick();
    }
  };

  return (
    <footer className={css.footer}>
      <textarea
        id="textarea"
        placeholder="Write your message"
        onKeyDown={handleEnter}
        onKeyUp={adjustTextArea}
        onChange={(e) => handleChange(e.target.value)}
        className={css.textArea}
        rows={2}
        cols={33}
        value={inputState}
      />
      <div className={css.send} onClick={handleClick}>
        Send
      </div>
    </footer>
  );
}

export default ChatBox;
