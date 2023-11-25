import { useEffect } from "react";
import css from "./App.module.css";
import { Chat } from "./gen/chat/v1/chat_rsm_react";
import React from "react";

function App() {
  const { useGetAll } = Chat( {id : "test"} ); // storeMutationsLocallyInNamespace = ?

  const {
    response,
    isLoading,
    mutations: { Post }, // any write methods exposed via mutations
  } = useGetAll();

  useEffect(() => {
    console.log('initial render..')

  },[])

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
