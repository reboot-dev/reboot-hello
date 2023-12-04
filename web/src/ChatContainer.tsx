import styles from "./ChatContainer.module.css";

interface Message {
  fromUser: string;
  string: string;
}

function ChatContainer({ receiver, chats }: { receiver: string; chats: any[] }) {

  const generateMessage = (chat: Message, i: number) => {
    let avatarInitials = chat.fromUser[0]
    if (chat.fromUser === receiver) {
      return (
        <div className={styles.sentMessage}>
          <div className={styles.messageBubble}>
            {chat.string}
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
            <div className={styles.messageBubble}>{chat.string}</div>
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
    </div>
  );
}

export default ChatContainer;
