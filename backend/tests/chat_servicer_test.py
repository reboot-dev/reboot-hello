import unittest
from chat.v1.chat_rsm import Chat, GetAllResponse, PostRequest, PostResponse
from chat_servicer import ChatServicer
# from greeter_servicer import GreeterServicer
# from hello_world.v1.greeter_rsm import Greeter, GreetResponse
from resemble.aio.tests import Resemble
from resemble.aio.workflows import Workflow


class TestGreeter(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.rsm = Resemble()
    async def asyncTearDown(self) -> None:
        await self.rsm.down()

    async def test_chat_servicer(self) -> None:
        await self.rsm.up(servicers=[ChatServicer])
        workflow: Workflow = self.rsm.create_workflow(name=f"test-{self.id()}")
        chat = Chat("test-chat")

        await chat.Create(workflow,)
        response: GetAllResponse = await chat.GetAll(workflow,)
        self.assertEqual(response.chats, [])

        await chat.Post(workflow, message='string', from_user='ed')
        post_response: PostResponse = await chat.GetAll(workflow,)
        self.assertEqual(post_response.chats[0].from_user, 'ed')
        self.assertEqual(post_response.chats[0].contents, 'string')
