import asyncio
from hello.v1.hello_rsm import (
    Hello,
    HelloState,
    MessagesRequest,
    MessagesResponse,
    SendRequest,
    SendResponse,
)
from resemble.aio.contexts import ReaderContext, WriterContext


class HelloServicer(Hello.Interface):

    async def Messages(
        self,
        context: ReaderContext,
        state: HelloState,
        request: MessagesRequest,
    ) -> MessagesResponse:
        return MessagesResponse(messages=state.messages)

    async def Send(
        self,
        context: WriterContext,
        state: HelloState,
        request: SendRequest,
    ) -> Hello.SendEffects:
        # Mimic latency by sleeping.
        await asyncio.sleep(0.5)

        message = request.message
        state.messages.extend([message])
        return Hello.SendEffects(state=state, response=SendResponse())
