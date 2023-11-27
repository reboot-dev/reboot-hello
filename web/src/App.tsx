import { useEffect, useState } from "react";
import css from "./App.module.css";
import { Chat } from "./gen/chat/v1/chat_rsm_react";
import React from "react";

interface Message {
  from_user: string;
  text: string;
}

interface ChatRoomState {
  chats: Message[];
}

interface PostRequest {
  message: string;
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
      Post({ message });
      setMessage("");
    }
  };

  useEffect(() => {
    console.log("initial render..");
  }, []);

  console.log(response)

  return (
    <div>
      {response && response.chats.length > 1 ? response.chats.map( (chat, i) => {
        return(
        <div key={i}>
          {chat.string}
        </div>
        )
      }
      ) : ""}
      <div className={css.messageInput}>
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
