from hello.v1.hello_rbt import (
    Hello,
    MessagesRequest,
    MessagesResponse,
    SendRequest,
    SendResponse,
)
from reboot.aio.contexts import ReaderContext, WriterContext


class HelloServicer(Hello.Interface):

    async def Messages(
        self,
        context: ReaderContext,
        state: Hello.State,
        request: MessagesRequest,
    ) -> MessagesResponse:
        return MessagesResponse(messages=state.messages)

    async def Send(
        self,
        context: WriterContext,
        state: Hello.State,
        request: SendRequest,
    ) -> SendResponse:
        message = request.message
        state.messages.extend([message])
        return SendResponse()
