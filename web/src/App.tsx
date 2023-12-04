import { useEffect, useState } from "react";
import { Chat } from "./gen/chat/v1/chat_rsm_react";
import React from "react";
import styles from "./ChatContainer.module.css";
import ChatContainer from "./ChatContainer";

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

  function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  const handleSendMessage = () => {
    let num = getRandomInt(5); // using a random number to mock another user

    if (message) {
      if (num <= 2) {
        Post({ fromUser: 'other user', message });
      } else if ( num === 3){
        Post({ fromUser: 'rare user', message });
      } else {
        Post({ fromUser: RECIEVER, message });
      }
      setMessage("");
    }
  };

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
