from resemble.aio.contexts import ReaderContext, WriterContext

class ChatServicer(Chat.Interface):

      async def GetAll(
        self,
        context: ReaderContext,
        state: ChatState,
        request: GetAllRequest,
    ) -> GetAllResponse:
        return GetAllResponse(
            chats=state.chats,
            )