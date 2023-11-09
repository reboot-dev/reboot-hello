import asyncio
import logging
from chat_servicer import ChatServicer
from hello_world.v1.greeter_rsm import Greeter
from resemble.aio.applications import Application
from resemble.aio.workflows import Workflow

logging.basicConfig(level=logging.INFO)

EXAMPLE_CHAT_ID = 'greeter-hello-world'


async def initialize(workflow: Workflow):
    greeter = Chat(EXAMPLE_CHAT_ID)

    # Implicitly construct greeter upon first write.
    await greeter.Greet(workflow, greeting="Hello, World!")


async def main():
    application = Application(
        servicers=[ChatServicer],
        initialize=initialize,
    )

    logging.info('👋 Hello, World? Hello, Resemble! 👋')

    await application.run()


if __name__ == '__main__':
    asyncio.run(main())
