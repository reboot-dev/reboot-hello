import styles from "./ChatContainer.module.css";

interface Message {
  fromUser: string;
  string: string;
}

function ChatContainer({ receiver, chats }: { receiver: string; chats: any[] }) {

  const generateMessage = (chat: Message, i: number) => {
    if (chat.fromUser === 'ed') {
      return (
        <div key={i} className={styles.chatList}>
          <div
            className={styles.sentMessage}
          >
            <div className={styles.messageBubble}>
              {chat.string}
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div key={i} className={styles.chatList}>
          <div className={styles.receivedMessage}>
            <div className={styles.receivedMessage}>
              {chat.fromUser}
            </div>
            <div className={styles.messageBubble}>{chat.string}</div>
          </div>
        </div>
      )
    }
  }

  return (
    <div className={styles.chatLog}>
      {chats.map((chat, i: number) => (
        // <div key={i} className={styles.chatList}>
        //   {chat.fromUser !== "ed" && ( // Check if the sender is not 'ed'
        //   <div>
        //     {chat.fromUser}
        //   </div>
        //   )}
        //   <div
        //     className={
        //       chat.fromUser === "ed"
        //         ? styles.sentMessage
        //         : styles.receivedMessage
        //     }
        //   >
        //     <div className={styles.messageBubble}>{chat.string}</div>
        //   </div>
        // </div>
        <div key={i} className={styles.chatList}>
        {generateMessage(chat, i)}
        </div>
      ))}
    </div>
  );
}

export default ChatContainer;
