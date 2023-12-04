import styles from "./ChatContainer.module.css";


interface Message {
  from_user: string;
  string: string;
}

function ChatContainer({ receiver, chats }: { receiver: string; chats: any[] }) {

  const generateMessage = (chat: Message, index: number) => {
    if (chat.from_user === 'ed') {
      return (
        <div
          className={styles.sentMessage}
        >
          <div className={styles.messageBubble}>
            {chat.string}
          </div>
        </div>
      )
    } else {
      return (
        <div key={index} className={styles.receivedMessage}>
          <div className={styles.receivedMessage}>
            {chat.from_user}
          </div>
          <div className={styles.messageBubble}>{chat.string}</div>
        </div>
      )
    }
  }

  return (
    <div className={styles.chatLog}>
      {chats.map((chat, i: number) => (
        <div key={i} className={styles.chatList}>
          {chat.fromUser !== "ed" && ( // Check if the sender is not 'ed'
          <div className={styles.senderName}>
            {chat.fromUser}
          </div>
          )}
          <div
            className={
              chat.fromUser === "ed"
                ? styles.sentMessage
                : styles.receivedMessage
            }
          >
            <div className={styles.messageBubble}>{chat.string}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChatContainer;
