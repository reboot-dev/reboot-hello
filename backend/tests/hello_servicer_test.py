import unittest
from hello.v1.hello_rsm import Hello, MessagesResponse
from hello_servicer import HelloServicer
from resemble.aio.tests import Resemble


class TestHello(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self) -> None:
        self.rsm = Resemble()
        await self.rsm.start()

    async def asyncTearDown(self) -> None:
        await self.rsm.stop()

    async def test_hello(self) -> None:
        await self.rsm.up(servicers=[HelloServicer])

        context = self.rsm.create_external_context(name=f"test-{self.id()}")

        hello = Hello.lookup("testing-hello")

        await hello.Send(context, message="Hello, World")

        response: MessagesResponse = await hello.Messages(context)
        self.assertEqual(response.messages, ["Hello, World"])

        await hello.Send(context, message="Hello, Resemble!")
        await hello.Send(context, message="Hello, Peace of Mind!")
        response = await hello.Messages(context)
        self.assertEqual(
            response.messages,
            [
                "Hello, World",
                "Hello, Resemble!",
                "Hello, Peace of Mind!",
            ],
        )
