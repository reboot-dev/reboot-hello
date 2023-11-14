import asyncio
import logging
from chat_servicer import ChatServicer
from chat.v1.chat_rsm import Chat
from resemble.aio.applications import Application
from resemble.aio.workflows import Workflow

logging.basicConfig(level=logging.INFO)

EXAMPLE_CHAT_ID = 'test'


async def initialize(workflow: Workflow):
    chat = Chat(EXAMPLE_CHAT_ID)

    # Implicitly construct chat upon first write.
    test = await chat.Post(workflow, message='test message')
    print('after await..', test)


async def main():
    application = Application(
        servicers=[ChatServicer],
        initialize=initialize,
    )

    logging.info('👋 Hello, World? Hello, Resemble! 👋')

    await application.run()


if __name__ == '__main__':
    asyncio.run(main())
