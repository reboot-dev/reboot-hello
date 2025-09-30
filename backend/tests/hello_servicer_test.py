import unittest
from hello.v1.hello_rbt import Hello, MessagesResponse
from hello_servicer import HelloServicer
from reboot.aio.applications import Application
from reboot.aio.tests import Reboot


class TestHello(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self) -> None:
        self.rbt = Reboot()
        await self.rbt.start()

    async def asyncTearDown(self) -> None:
        await self.rbt.stop()

    async def test_hello(self) -> None:
        await self.rbt.up(Application(servicers=[HelloServicer]))

        context = self.rbt.create_external_context(name=f"test-{self.id()}")

        hello = Hello.ref("testing-hello")

        await hello.send(context, message="Hello, World")

        response: MessagesResponse = await hello.messages(context)
        self.assertEqual(response.messages, ["Hello, World"])

        await hello.send(context, message="Hello, Reboot!")
        await hello.send(context, message="Hello, Peace of Mind!")
        response = await hello.messages(context)
        self.assertEqual(
            response.messages,
            [
                "Hello, World",
                "Hello, Reboot!",
                "Hello, Peace of Mind!",
            ],
        )
