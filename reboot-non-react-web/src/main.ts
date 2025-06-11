import { WebContext } from "@reboot-dev/reboot-web";
import {
  Hello,
  MessagesResponse,
} from "../../web/src/api/hello/v1/hello_rbt_web";

const root = document.getElementById("messages");
const button = document.getElementById("button");

const context = new WebContext({
  url: "http://localhost:9991",
});
const hello = Hello.ref("reboot-hello");

button!.addEventListener("click", async () => {
  const inputElement = document.getElementById("input") as HTMLInputElement;
  await handleClick(inputElement);
});

async function handleClick(element: HTMLInputElement) {
  const message = element.value;
  if (message === "") {
    return;
  }

  await hello.send(context, {
    message: message,
  });

  element.value = "";
}

async function bindToElement(
  element: HTMLElement,
  generator: AsyncGenerator<MessagesResponse>
) {
  for await (const response of generator) {
    element.innerHTML = `${response.messages
      .map((msg) => `<div class="message">${msg}</div>`)
      .join("")}`;
  }
}

const [responses] = await hello.reactively().messages(context);

bindToElement(root, responses);

console.log("Hello Reboot Web example is running!");
