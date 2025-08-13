import asyncio
import logging
from hello.v1.hello_rbt import Hello
from hello_servicer import HelloServicer
from reboot.aio.applications import Application
from reboot.aio.external import InitializeContext

logging.basicConfig(level=logging.INFO)

EXAMPLE_STATE_MACHINE_ID = 'reboot-hello'


async def initialize(context: InitializeContext):
    hello = Hello.ref(EXAMPLE_STATE_MACHINE_ID)

    # Implicitly construct state machine upon first write.
    await hello.Send(
        context,
        message="Hello, World!",
    )

    logging.info('👋 Hello, World? Hello, Reboot! 👋')


async def main():
    await Application(
        servicers=[HelloServicer],
        initialize=initialize,
    ).run()


if __name__ == '__main__':
    asyncio.run(main())
