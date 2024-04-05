import asyncio
import logging
from hello.v1.hello_rsm import Hello
from hello_servicer import HelloServicer
from resemble.aio.applications import Application
from resemble.aio.workflows import Workflow

logging.basicConfig(level=logging.INFO)

EXAMPLE_STATE_MACHINE_ID = 'resemble-hello'


async def initialize(workflow: Workflow):
    hello = Hello.lookup(EXAMPLE_STATE_MACHINE_ID)

    # Implicitly construct state machine upon first write.
    await hello.Send(workflow, message="Hello, World!")


async def main():
    application = Application(
        servicers=[HelloServicer],
        initialize=initialize,
    )

    logging.info('👋 Hello, World? Hello, Resemble! 👋')

    await application.run()


if __name__ == '__main__':
    asyncio.run(main())
