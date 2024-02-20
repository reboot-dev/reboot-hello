import {  SetStateAction , useState } from "react";
import { useChat } from "./gen/chat/v1/chat_rsm_react";
import styles from "./ChatContainer.module.css";
import ChatContainer from "./ChatContainer";
import Login from "./Login";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState<string>("");;
  const { useGetAll, mutators } = useChat({ id: "(singleton)" });

  const {
    response,
    isLoading,
  } = useGetAll();

  const handleChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
    setMessage(event.target.value);
  };

  const handleSendMessage = () => {
    if (message) {
      mutators.post({ fromUser: username, message });
      setMessage("");
    }
  };

  const handleLogin = (username: string) => {
    setUsername(username); // Set the username in the state
    setIsLoggedIn(true);
    // console.log('username is ', username)
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className={styles.chatContainer}>
      {response && response.chats.length > 0 && (
        <ChatContainer chats={response.chats} username={username} />
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
