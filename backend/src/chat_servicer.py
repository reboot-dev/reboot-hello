from chat.v1.chat_rsm import (
    Chat,
    ChatRoomState,
    CreateRequest,
    CreateResponse,
    GetAllRequest,
    GetAllResponse,
    PostRequest,
    PostResponse,
    Message
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
      ) -> Chat.CreateEffects:
          state = ChatRoomState(chats=[])
          return Chat.CreateEffects(state=state, response=CreateResponse())

      async def Post(
        self,
        context: WriterContext,
        state: ChatRoomState,
        request: PostRequest,
      ) -> Chat.PostEffects:
          message = Message(from_user=request.from_user, contents=request.message)
          state.chats.extend([message])
          return Chat.PostEffects(state=state, response=PostResponse())