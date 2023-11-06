import { useEffect } from "react";
import css from "./App.module.css";
import { Chat } from "./Chat";
import ChatBox from "./ChatBox";
import MessageComp from "./Message";
import { ClearRequest, PostRequest } from "./gen/chat_pb";

function App() {
  const { useGetAll } = Chat("chatroom");

  const {
    response,
    isLoading,
    mutations: { Post },
    pendingPostMutations,
    failedPostMutations,
    recoveredPostMutations,
  } = useGetAll({ storeMutationsLocallyWithKey: "chatroom-post-mutations" });
  useEffect(() => {
    for (const mutation of failedPostMutations) {
      alert(`${mutation.error}`);
    }
  }, [failedPostMutations]);

  const postMessage = async (contents: string) => {
    const postRequest = new PostRequest({
      message: { fromUser: "Riley", contents: contents },
    });
    await Post(postRequest);
  };

  if (response === undefined) return <div>Loading...</div>;

  return (
    <div>
      {isLoading ? "Loading..." : ""}
      <div className={css.messagesPage}>
        <div className={css.messagesContainer}>
          {response.messages.map((message) => (
            <MessageComp
              key={message.fromUser + message.contents}
              fromUser={message.fromUser}
              contents={message.contents}
              optimistic={false}
            />
          ))}
          {pendingPostMutations
            .map((mutation): [PostRequest, boolean, unknown] => [
              mutation.request,
              mutation.isLoading,
              mutation.error,
            ])
            .filter((mutation): mutation is [PostRequest, boolean, unknown] => {
              return mutation[0].message !== undefined;
            })
            .map(([request, isLoading, error]) => (
              <MessageComp
                key={`${request.message?.fromUser} ${request.message?.contents}`}
                fromUser={`${request.message?.fromUser}`}
                contents={`${request.message?.contents}`}
                optimistic={true}
                isLoading={isLoading}
                error={error}
              />
            ))}
        </div>
        <ChatBox postMessage={postMessage} />
      </div>
    </div>
  );
}

export default App;
