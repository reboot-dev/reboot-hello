import unittest
from hello.v1.hello_rsm import Hello, MessagesResponse
from hello_servicer import HelloServicer
from resemble.aio.tests import Resemble
from resemble.aio.workflows import Workflow


class TestHello(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self) -> None:
        self.rsm = Resemble()
        await self.rsm.start()

    async def asyncTearDown(self) -> None:
        await self.rsm.stop()

    async def test_hello(self) -> None:
        await self.rsm.up(servicers=[HelloServicer])

        workflow: Workflow = self.rsm.create_workflow(name=f"test-{self.id()}")

        hello = Hello("testing-hello")

        await hello.Send(workflow, message="Hello, World")

        response: MessagesResponse = await hello.Messages(workflow)
        self.assertEqual(response.messages, ["Hello, World"])

        await hello.Send(workflow, message="Hello, Resemble!")
        await hello.Send(workflow, message="Hello, Peace of Mind!")
        response = await hello.Messages(workflow)
        self.assertEqual(
            response.messages,
            [
                "Hello, World",
                "Hello, Resemble!",
                "Hello, Peace of Mind!",
            ],
        )
