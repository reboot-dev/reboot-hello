import { KeyboardEvent, useEffect, useState } from "react";
import { Chat } from "./gen/chat/v1/chat_rsm_react";
import React from "react";
import styles from "./ChatContainer.module.css";
import ChatContainer from "./ChatContainer";

interface Message {
  from_user: string;
  text: string;
}

function App() {
  const [message, setMessage] = useState("");
  const { useGetAll } = Chat({ id: "test" });
  const RECIEVER = 'ed';

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
      if (message === 'other user') {
        Post({ fromUser: 'friend', message });
      } else {
        Post({ fromUser: RECIEVER, message });
      }
      setMessage("");
    }
  };

  useEffect(() => {
    console.log("initial render..");
  }, []);

  console.log(response)

  return (
    <div className={styles.chatContainer}>
      {response && response.chats.length > 0 ? (
        <ChatContainer chats={response.chats} receiver={RECIEVER} />
      ) : (
        ""
      )}
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
