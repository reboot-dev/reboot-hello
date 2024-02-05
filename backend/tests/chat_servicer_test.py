import unittest
from chat.v1.chat_rsm import Chat, GetAllResponse, PostResponse
from chat_servicer import ChatServicer
from resemble.aio.tests import Resemble
from resemble.aio.workflows import Workflow


class TestGreeter(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.rsm = Resemble()
        await self.rsm.start()

    async def asyncTearDown(self) -> None:
        await self.rsm.stop()

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
