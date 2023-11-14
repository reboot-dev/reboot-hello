from chat.v1.chat_rsm import (
    Chat,
    ChatRoomState,
    CreateRequest,
    CreateResponse,
    GetAllRequest,
    GetAllResponse,
    PostRequest,
    PostResponse
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
      ) -> CreateResponse:
          print('getAll request', request)
          state = ChatRoomState(chats=[])
          return Chat.CreateEffects(state=state, response=CreateResponse())

      async def Post(
        context: WriterContext,
        state: ChatRoomState,
        request: GetAllRequest,
      ) -> Chat.PostEffects:
          print('Post request in servicer')
          message = request.message
          state.chats.extend([message])
          return Chat.PostEffects([state.chats.extend([message])])