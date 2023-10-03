import asyncio
from hello_world.v1.greeter_rsm import (
    Greeter,
    GreeterState,
    GreetingsRequest,
    GreetingsResponse,
    GreetRequest,
    GreetResponse,
)
from resemble.aio.contexts import ReaderContext, WriterContext


class GreeterServicer(Greeter.Interface):

    async def Greetings(
        self, context: ReaderContext, state: GreeterState,
        request: GreetingsRequest
    ) -> GreetingsResponse:
        return GreetingsResponse(greetings=state.greetings)

    async def Greet(
        self,
        context: WriterContext,
        state: GreeterState,
        request: GreetRequest,
    ) -> Greeter.GreetEffects:
        greeting = request.greeting
        state.greetings.extend([greeting])
        return Greeter.GreetEffects(
            state=state, response=GreetResponse(greeting=greeting)
        )
