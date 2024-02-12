import {  SetStateAction , useState } from "react";
import { useChat } from "./gen/chat/v1/chat_rsm_react";
import styles from "./ChatContainer.module.css";
import ChatContainer from "./ChatContainer";
import Login from "./Login";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const { useGetAll, mutators } = useChat({ id: "(singleton)" });
  const RECIEVER = 'ed';

  const {
    response,
    isLoading,
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
      if (num === 2) {
        mutators.post({ fromUser: 'other user', message });
      } else if ( num === 3){
        mutators.post({ fromUser: 'rare user', message });
      } else {
        mutators.post({ fromUser: RECIEVER, message });
      }
      setMessage("");
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }
  
  return (
    <div className={styles.chatContainer}>
      {response && response.chats.length > 0 && (
        <ChatContainer chats={response.chats} receiver={RECIEVER} />
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
