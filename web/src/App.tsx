import {  SetStateAction , useEffect, useState } from "react";
import { useChat } from "./gen/chat/v1/chat_rsm_react";
import styles from "./ChatContainer.module.css";
import ChatContainer from "./ChatContainer";
import Login from "./Login";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState<string>("");
  const { useGetAll, mutators } = useChat({ id: "(singleton)" });

  useEffect(() => {
    // Check if user is logged in on initial load
    const loggedInUser = localStorage.getItem("username");
    if (loggedInUser) {
      setUsername(loggedInUser);
      setIsLoggedIn(true);
    }
  }, []);

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
    setUsername(username);
    setIsLoggedIn(true);

    localStorage.setItem("username", username);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    // Clear username from local storage
    localStorage.removeItem("username");
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className={styles.chatContainer}>
      <header className={styles.header}>
        <h1>Resemble</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>
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
