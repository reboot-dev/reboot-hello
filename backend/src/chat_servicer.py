from chat.v1.chat_rsm import (
    Chat,
    ChatRoomState,
    CreateRequest,
    CreateResponse,
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
            chats=state.chats,
            )

      async def Create(
        self,
        context: WriterContext,
        request: CreateRequest,
      ) -> CreateResponse:
          state = ChatRoomState()
          return Chat.CreateEffects(state=state, response=CreateResponse())