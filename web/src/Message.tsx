import cx from "classnames";
import css from "./Message.module.css";

const appOrigin = "Riley";

interface MessageProperties {
  fromUser: string;
  contents: string;
  optimistic: boolean;
  isLoading?: boolean;
  error?: unknown;
}

function Message({
  fromUser,
  contents,
  optimistic,
  isLoading,
  error,
}: MessageProperties) {
  return (
    <div className={css.messageRow}>
      <div
        className={cx(css.messageContainer, {
          [css.you]: appOrigin === fromUser && !optimistic,
          [css.youOptimistic]:
            appOrigin === fromUser &&
            optimistic &&
            isLoading &&
            error === undefined,
          [css.youOptimisticError]:
            appOrigin === fromUser &&
            optimistic &&
            !isLoading &&
            error !== undefined,
          [css.youOptimisticQueued]:
            appOrigin === fromUser &&
            optimistic &&
            !isLoading &&
            error === undefined,
          [css.youOptimisticRetry]:
            appOrigin === fromUser &&
            optimistic &&
            isLoading &&
            error !== undefined,
        })}
      >
        <div className={css.messageHeader}>
          <span style={{ marginRight: 10 }}>
            {appOrigin === fromUser ? "you" : fromUser}
          </span>
        </div>
        <div>{contents}</div>
      </div>
    </div>
  );
}

export default Message;
