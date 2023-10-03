import asyncio
import logging
from hello_world.v1.greeter_rsm import Greeter
from greeter_servicer import GreeterServicer
from resemble.aio.applications import Application
from resemble.aio.workflows import Workflow

logging.basicConfig(level=logging.INFO)

EXAMPLE_GREETER_ID = 'greeter-hello-world'


async def initialize(workflow: Workflow):
    greeter = Greeter(EXAMPLE_GREETER_ID)

    # Implicitly construct greeter upon first write.
    await greeter.Greet(workflow, greeting="Hello, World!")


async def main():
    application = Application(
        servicers=[GreeterServicer],
        initialize=initialize,
    )

    logging.info('👋 Hello, World? Hello, Resemble! 👋')

    await application.run()


if __name__ == '__main__':
    asyncio.run(main())
