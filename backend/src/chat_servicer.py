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
          print('Post request in servicer', request)
          # message = request.message
          # from_user = 'ed'
          obj1 = Message(from_user='ed', string=request.message)
          state.chats.extend([obj1])
          return Chat.PostEffects(state=state, response=PostResponse())