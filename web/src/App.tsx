import { useEffect } from "react";
import css from "./App.module.css";
import { Chat } from "./gen/chat/v1/chat_rsm_react";

function App() {
  const { useGetAll } = Chat( {id : "test"} );

  const {
    response,
    isLoading,
    // mutations: { Post },
  } = useGetAll({ storeMutationsLocallyWithKey: "chatroom-post-mutations" });

  console.log('response: ', response)

  return (
    <div>
      {isLoading ? "Loading..." : ""}
      <div className={css.messagesPage}>
        chat box div
        {
        response ?
        <>loading</> :
        <> response is {response}</>
        }
      </div>
    </div>
  );
}

export default App;
