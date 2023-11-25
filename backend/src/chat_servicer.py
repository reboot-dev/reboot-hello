from chat.v1.chat_rsm import (
    Chat,
    ChatRoomState,
    CreateRequest,
    CreateResponse,
    GetAllRequest,
    GetAllResponse,
    PostRequest,
)
from resemble.aio.contexts import ReaderContext, WriterContext

class ChatServicer(Chat.Interface):

      async def GetAll(
        self,
        context: ReaderContext,
        state: ChatRoomState,
        request: GetAllRequest,
      ) -> GetAllResponse:
        print('getAll request', request)
        return GetAllResponse(
            chats=state.chats,
            )

      async def Create(
        self,
        context: WriterContext,
        request: CreateRequest,
      ) -> Chat.CreateEffects:
          print('getAll request', request)
          state = ChatRoomState(chats=[])
          return Chat.CreateEffects(state=state, response=CreateResponse())

      async def Post(
        self,
        context: WriterContext,
        state: ChatRoomState,
        request: PostRequest,
      ) -> Chat.PostEffects:
          print('Post request in servicer')
          message = request.message
          state.chats.extend([message])
          return Chat.PostEffects(state.chats.extend([message]))