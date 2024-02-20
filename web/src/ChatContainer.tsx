import { useEffect, useRef } from "react";
import styles from "./ChatContainer.module.css";

interface Message {
  fromUser: string;
  contents: string;
}

function ChatContainer({ username, chats }: { username: string; chats: any[] }) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    console.log('chats: ', chats)
    scrollToBottom(); // Scroll to the bottom on initial load
  }, [chats]);

  const generateMessage = (chat: Message, i: number) => {
    let avatarInitials = chat.fromUser[0]
    if (chat.fromUser === username) {
      return (
        <div className={styles.sentMessage}>
          <div className={styles.messageBubble}>
            {chat.contents}
          </div>
        </div>
      )
    } else {
      return (
        <div className={styles.receivedMessage}>
          <div className={styles.receivedMessageSenderName}>
            {chat.fromUser}
          </div>
          <div className={styles.recievedMessageAndAvatar}>
            <div className={styles.avatarBubble}>{avatarInitials}</div>
            <div className={styles.messageBubble}>{chat.contents}</div>
          </div>
        </div>
      )
    }
  }

  return (
    <div className={styles.chatLog}>
      {chats.map((chat, i: number) => (
        <div key={i} className={styles.chatList}>
        {generateMessage(chat, i)}
        </div>
      ))}
      <div ref={chatEndRef} />
    </div>
  );
}

export default ChatContainer;
