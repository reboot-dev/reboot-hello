from chat.v1.chat_rsm import (
    Chat,
    ChatRoomState,
    GetAllRequest,
    GetAllResponse
)
from resemble.aio.contexts import ReaderContext, WriterContext

class ChatServicer(Chat.Interface):

      async def GetAll(
        self,
        context: ReaderContext,
        state: ChatRoomState,
        request: GetAllRequest,
      ) -> GetAllResponse:
        return GetAllResponse(
            ChatRoomState=state.ChatRoomState,
            )