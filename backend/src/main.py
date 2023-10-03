import asyncio
import logging
from greeter_servicer import GreeterServicer
from resemble.aio.applications import Application
from resemble.aio.workflows import Workflow

logging.basicConfig(level=logging.INFO)


async def initialize(workflow: Workflow):
    logging.info(f"Greeter is ready... Try recording a greeting!")


async def main():
    await Application(
        servicers=[GreeterServicer],
        initialize=initialize,
    ).run()


if __name__ == '__main__':
    asyncio.run(main())
