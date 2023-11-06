<<<<<<< HEAD
import { FC, useState } from "react";
import css from "./App.module.css";
import { Greeter } from "./gen/hello_world/v1/greeter_rsm_react";
// We can choose any id we want because the state will be constructed when we
// make the first .writer call.
const GREETER_ID = "greeter-hello-world";
=======
import { useEffect } from "react";
import css from "./App.module.css";
import { Chat } from "./Chat";
import ChatBox from "./ChatBox";
import MessageComp from "./Message";
import { ClearRequest, PostRequest } from "./gen/chat_pb";
>>>>>>> 27211cf (first commit)

function App() {
  const { useGetAll } = Chat("chatroom");

  const {
    response,
    isLoading,
    mutations: { Post, Clear },
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

  const clearMessages = async () => {
    const clearRequest = new ClearRequest();
    await Clear(clearRequest);
  };

  if (response === undefined) return <div>Loading...</div>;

  return (
<<<<<<< HEAD
    <div className={css.greetings}>
      <input
        type="text"
        className={css.textInput}
        onChange={(e) => setGreetingMessage(e.target.value)}
        value={greetingMessage}
        placeholder="<your message here>"
      />
      <button
        className={
          greetingMessage === "" ? css.buttonDisabled : css.buttonEnabled
        }
        onClick={handleClick}
        disabled={greetingMessage === ""}
      >
        Greet
      </button>
      {response !== undefined &&
        response.greetings.length > 0 &&
        response.greetings.map((greeting: string) => (
          <Greeting text={greeting} key={greeting} />
        ))}
=======
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
        <button onClick={clearMessages}>Clear Messages</button>
      </div>
>>>>>>> 27211cf (first commit)
    </div>
  );
}

export default App;
