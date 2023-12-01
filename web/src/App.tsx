import { useEffect, useState } from "react";
import { Chat } from "./gen/chat/v1/chat_rsm_react";
import React from "react";
import styles from "./MessageContainer.module.css";

interface Message {
  from_user: string;
  text: string;
}

function App() {
  const [message, setMessage] = useState("");
  const { useGetAll } = Chat({ id: "test" });

  const {
    response,
    isLoading,
    mutations: { Post }
  } = useGetAll();


  const handleChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
    setMessage(event.target.value);
  };

  const handleSendMessage = () => {
    if (message) {
      Post({ fromUser: 'ed', message });
      setMessage("");
    }
  };

  useEffect(() => {
    console.log("initial render..");
  }, []);

  console.log(response)

  return (
    <div>
      {response && response.chats.length > 0 ? response.chats.map( (chat, i) => {
        return(
        <div
          key={i}
          className={
            chat.fromUser === "ed" ? styles.sentMessage : styles.receivedMessage
          }>
            <div className={styles.messageBubble}>{chat.string}</div>
        </div>
        )
      }
      ) : ""}
      <div className={styles.messageInput}>
        <input
          type="text"
          value={message}
          onChange={handleChange}
          placeholder="Enter message"
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;
