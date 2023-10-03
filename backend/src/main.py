import asyncio
import logging
from greeter_servicer import GreeterServicer
from resemble.aio.applications import Application
from resemble.aio.workflows import Workflow

logging.basicConfig(level=logging.INFO)

async def main():
    application = Application(
        servicers=[GreeterServicer],
    )

    logger.info('👋🏿 👋🏾 👋🏽 👋🏼 👋🏻 Hello, World? Hello, Resemble! 👋🏻 👋🏼 👋🏽 👋🏾 👋🏿')

    await application.run()


if __name__ == '__main__':
    asyncio.run(main())
