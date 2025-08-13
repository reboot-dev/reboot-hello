from hello.v1.hello_rbt import (
    Hello,
    MessagesRequest,
    MessagesResponse,
    SendRequest,
    SendResponse,
)
from reboot.aio.auth.authorizers import allow
from reboot.aio.contexts import ReaderContext, WriterContext


class HelloServicer(Hello.Servicer):

    def authorizer(self):
        return allow()

    async def Messages(
        self,
        context: ReaderContext,
        request: MessagesRequest,
    ) -> MessagesResponse:
        return MessagesResponse(messages=self.state.messages)

    async def Send(
        self,
        context: WriterContext,
        request: SendRequest,
    ) -> SendResponse:
        message = request.message
        self.state.messages.extend([message])
        return SendResponse()
