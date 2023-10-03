import unittest
from hello_world.v1.greeter_rsm import Greeter, GreetResponse
from greeter_servicer import GreeterServicer
from resemble.aio.tests import Resemble
from resemble.aio.workflows import Workflow


class TestGreeter(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self) -> None:
        self.rsm = Resemble()

    async def asyncTearDown(self) -> None:
        await self.rsm.down()

    async def test_hello_world(self) -> None:
        await self.rsm.up(servicers=[GreeterServicer])

        workflow: Workflow = self.rsm.create_workflow(name=self.id())

        greeter = Greeter("testing-greeter")

        await greeter.Greet(workflow, greeting="Hello, World")

        response: GreetingsResponse = await greeter.Greetings(workflow)
        self.assertEqual(response.greetings, ["Hello, World"])

        await greeter.Greet(workflow, greeting="Hello, Resemble!")
        await greeter.Greet(workflow, greeting="Hello, Peace of Mind!")
        response: GreetingsResponse = await greeter.Greetings(workflow)
        self.assertEqual(response.greetings, [
            "Hello, World",
            "Hello, Resemble!",
            "Hello, Peace of Mind!",
        ])
