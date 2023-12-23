# FastAgency

<b>Effortless event stream integration for your services</b>

---

<p align="center">
  <a href="https://github.com/airtai/fastagency/actions/workflows/test.yaml" target="_blank">
    <img src="https://github.com/airtai/fastagency/actions/workflows/test.yaml/badge.svg?branch=main" alt="Test Passing"/>
  </a>

  <a href="https://coverage-badge.samuelcolvin.workers.dev/redirect/airtai/fastagency" target="_blank">
      <img src="https://coverage-badge.samuelcolvin.workers.dev/airtai/fastagency.svg" alt="Coverage">
  </a>

  <a href="https://www.pepy.tech/projects/fastagency" target="_blank">
    <img src="https://static.pepy.tech/personalized-badge/fastagency?period=month&units=international_system&left_color=grey&right_color=green&left_text=downloads/month" alt="Downloads"/>
  </a>

  <a href="https://pypi.org/project/fastagency" target="_blank">
    <img src="https://img.shields.io/pypi/v/fastagency?label=PyPI" alt="Package version">
  </a>

  <a href="https://pypi.org/project/fastagency" target="_blank">
    <img src="https://img.shields.io/pypi/pyversions/fastagency.svg" alt="Supported Python versions">
  </a>

  <br/>

  <a href="https://github.com/airtai/fastagency/actions/workflows/codeql.yml" target="_blank">
    <img src="https://github.com/airtai/fastagency/actions/workflows/codeql.yml/badge.svg" alt="CodeQL">
  </a>

  <a href="https://github.com/airtai/fastagency/actions/workflows/dependency-review.yaml" target="_blank">
    <img src="https://github.com/airtai/fastagency/actions/workflows/dependency-review.yaml/badge.svg" alt="Dependency Review">
  </a>

  <a href="https://github.com/airtai/fastagency/blob/main/LICENSE" target="_blank">
    <img src="https://img.shields.io/github/license/airtai/fastagency.png" alt="License">
  </a>

  <a href="https://github.com/airtai/fastagency/blob/main/CODE_OF_CONDUCT.md" target="_blank">
    <img src="https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg" alt="Code of Conduct">
  </a>

  <a href="https://discord.gg/qFm6aSqq59" target="_blank">
      <img alt="Discord" src="https://img.shields.io/discord/1085457301214855171?logo=discord">
  </a>
</p>

---

## Features

[**FastAgency**](https://fastagency.airt.ai/latest/) simplifies the process of writing producers and consumers for message queues, handling all the
parsing, networking and documentation generation automatically.

Making streaming microservices has never been easier. Designed with junior developers in mind, **FastAgency** simplifies your work while keeping the door open for more advanced use cases. Here's a look at the core features that make **FastAgency** a go-to framework for modern, data-centric microservices.

- **Multiple Brokers**: **FastAgency** provides a unified API to work across multiple message brokers ([**Kafka**](https://kafka.apache.org/), [**RabbitMQ**](https://www.rabbitmq.com/), [**NATS**](https://nats.io/), [**Redis**](https://redis.io/) support)

- [**Pydantic Validation**](#writing-app-code): Leverage [**Pydantic's**](https://docs.pydantic.dev/) validation capabilities to serialize and validates incoming messages

- [**Automatic Docs**](#project-documentation): Stay ahead with automatic [**AsyncAPI**](https://www.asyncapi.com/) documentation

- **Intuitive**: Full-typed editor support makes your development experience smooth, catching errors before they reach runtime

- [**Powerful Dependency Injection System**](#dependencies): Manage your service dependencies efficiently with **FastAgency**'s built-in DI system

- [**Testable**](#testing-the-service): Supports in-memory tests, making your CI/CD pipeline faster and more reliable

- **Extensible**: Use extensions for lifespans, custom serialization and middleware

- [**Integrations**](#any-framework): **FastAgency** is fully compatible with any HTTP framework you want ([**FastAPI**](#fastapi-plugin) especially)

- [**Built for Automatic Code Generation**](#code-generator): **FastAgency** is optimized for automatic code generation using advanced models like GPT and Llama

That's **FastAgency** in a nutshell—easy, efficient, and powerful. Whether you're just starting with streaming microservices or looking to scale, **FastAgency** has got you covered.

---

**Documentation**: <a href="https://fastagency.airt.ai/latest/" target="_blank">https://fastagency.airt.ai/latest/</a>

---

## History

**FastAgency** is a new package based on the ideas and experiences gained from [**FastKafka**](https://github.com/airtai/fastkafka) and [**Propan**](https://github.com/lancetnik/propan). By joining our forces, we picked up the best from both packages and created a unified way to write services capable of processing streamed data regardless of the underlying protocol. We'll continue to maintain both packages, but new development will be in this project. If you are starting a new service, this package is the recommended way to do it.

---

## Install

**FastAgency** works on **Linux**, **macOS**, **Windows** and most **Unix**-style operating systems.
You can install it with `pip` as usual:

```sh
pip install fastagency[kafka]
# or
pip install fastagency[rabbit]
# or
pip install fastagency[nats]
# or
pip install fastagency[redis]
```

By default **FastAgency** uses **PydanticV2** written in **Rust**, but you can downgrade it manually, if your platform has no **Rust** support - **FastAgency** will work correctly with **PydanticV1** as well.

---

## Writing app code

**FastAgency** brokers provide convenient function decorators `@broker.subscriber`
and `@broker.publisher` to allow you to delegate the actual process of:

- consuming and producing data to Event queues, and

- decoding and encoding JSON-encoded messages

These decorators make it easy to specify the processing logic for your consumers and producers, allowing you to focus on the core business logic of your application without worrying about the underlying integration.

Also, **FastAgency** uses [**Pydantic**](https://docs.pydantic.dev/) to parse input
JSON-encoded data into Python objects, making it easy to work with structured data in your applications, so you can serialize your input messages just using type annotations.

Here is an example Python app using **FastAgency** that consumes data from an incoming data stream and outputs the data to another one:

```python
from fastagency import FastAgency
from fastagency.kafka import KafkaBroker
# from fastagency.rabbit import RabbitBroker
# from fastagency.nats import NatsBroker
# from fastagency.redis import RedisBroker

broker = KafkaBroker("localhost:9092")
# broker = RabbitBroker("amqp://guest:guest@localhost:5672/")
# broker = NatsBroker("nats://localhost:4222/")
# broker = RedisBroker("redis://localhost:6379/")

app = FastAgency(broker)

@broker.subscriber("in")
@broker.publisher("out")
async def handle_msg(user: str, user_id: int) -> str:
    return f"User: {user_id} - {user} registered"
```

Also, **Pydantic**’s [`BaseModel`](https://docs.pydantic.dev/usage/models/) class allows you
to define messages using a declarative syntax, making it easy to specify the fields and types of your messages.

```python
from pydantic import BaseModel, Field, PositiveInt
from fastagency import FastAgency
from fastagency.kafka import KafkaBroker

broker = KafkaBroker("localhost:9092")
app = FastAgency(broker)

class User(BaseModel):
    user: str = Field(..., examples=["John"])
    user_id: PositiveInt = Field(..., examples=["1"])

@broker.subscriber("in")
@broker.publisher("out")
async def handle_msg(data: User) -> str:
    return f"User: {data.user} - {data.user_id} registered"
```

---

## Testing the service

The service can be tested using the `TestBroker` context managers, which, by default, puts the Broker into "testing mode".

The Tester will redirect your `subscriber` and `publisher` decorated functions to the InMemory brokers, allowing you to quickly test your app without the need for a running broker and all its dependencies.

Using pytest, the test for our service would look like this:

```python
# Code above omitted 👆

import pytest
import pydantic
from fastagency.kafka import TestKafkaBroker


@pytest.mark.asyncio
async def test_correct():
    async with TestKafkaBroker(broker) as br:
        await br.publish({
            "user": "John",
            "user_id": 1,
        }, "in")

@pytest.mark.asyncio
async def test_invalid():
    async with TestKafkaBroker(broker) as br:
        with pytest.raises(pydantic.ValidationError):
            await br.publish("wrong message", "in")
```

## Running the application

The application can be started using built-in **FastAgency** CLI command.

To run the service, use the **FastAgency CLI** command and pass the module (in this case, the file where the app implementation is located) and the app symbol to the command.

``` shell
fastagency run basic:app
```

After running the command, you should see the following output:

``` shell
INFO     - FastAgency app starting...
INFO     - input_data |            - `HandleMsg` waiting for messages
INFO     - FastAgency app started successfully! To exit press CTRL+C
```

Also, **FastAgency** provides you with a great hot reload feature to improve your Development Experience

``` shell
fastagency run basic:app --reload
```

And multiprocessing horizontal scaling feature as well:

``` shell
fastagency run basic:app --workers 3
```

You can learn more about **CLI** features [here](https://fastagency.airt.ai/latest/getting-started/cli/)

---

## Project Documentation

**FastAgency** automatically generates documentation for your project according to the [**AsyncAPI**](https://www.asyncapi.com/) specification. You can work with both generated artifacts and place a web view of your documentation on resources available to related teams.

The availability of such documentation significantly simplifies the integration of services: you can immediately see what channels and message formats the application works with. And most importantly, it won't cost anything - **FastAgency** has already created the docs for you!

![HTML-page](https://github.com/airtai/fastagency/blob/main/docs/docs/assets/img/AsyncAPI-basic-html-short.png?raw=true)

---

## Dependencies

**FastAgency** (thanks to [**FastDepends**](https://lancetnik.github.io/FastDepends/)) has a dependency management system similar to `pytest fixtures` and `FastAPI Depends` at the same time. Function arguments declare which dependencies you want are needed, and a special decorator delivers them from the global Context object.

```python
from fastagency import Depends, Logger

async def base_dep(user_id: int) -> bool:
    return True

@broker.subscriber("in-test")
async def base_handler(user: str,
                       logger: Logger,
                       dep: bool = Depends(base_dep)):
    assert dep is True
    logger.info(user)
```

---

## HTTP Frameworks integrations

### Any Framework

You can use **FastAgency** `MQBrokers` without a `FastAgency` application.
Just *start* and *stop* them according to your application's lifespan.

```python
from aiohttp import web

from fastagency.kafka import KafkaBroker

broker = KafkaBroker("localhost:9092")

@broker.subscriber("test")
async def base_handler(body):
    print(body)

async def start_broker(app):
    await broker.start()

async def stop_broker(app):
    await broker.close()

async def hello(request):
    return web.Response(text="Hello, world")

app = web.Application()
app.add_routes([web.get("/", hello)])
app.on_startup.append(start_broker)
app.on_cleanup.append(stop_broker)

if __name__ == "__main__":
    web.run_app(app)
```

### **FastAPI** Plugin

Also, **FastAgency** can be used as part of **FastAPI**.

Just import a **StreamRouter** you need and declare the message handler with the same `@router.subscriber(...)` and `@router.publisher(...)` decorators.

```python
from fastapi import FastAPI
from pydantic import BaseModel

from fastagency.kafka.fastapi import KafkaRouter

router = KafkaRouter("localhost:9092")

class Incoming(BaseModel):
    m: dict

@router.subscriber("test")
@router.publisher("response")
async def hello(m: Incoming):
    return {"response": "Hello, world!"}

app = FastAPI(lifespan=router.lifespan_context)
app.include_router(router)
```

More integration features can be found [here](https://fastagency.airt.ai/latest/getting-started/integrations/fastapi/)

---

## Code generator

As evident, **FastAgency** is an incredibly user-friendly framework. However, we've taken it a step further and made it even more user-friendly! Introducing [fastagency-gen](https://fastagency-gen.airt.ai), a Python library that harnesses the power of generative AI to effortlessly generate **FastAgency** applications. Simply describe your application requirements, and [fastagency-gen](https://fastagency-gen.airt.ai) will generate a production-grade **FastAgency** project that is ready to deploy in no time.

Save application description inside `description.txt`:
```
Create a FastAgency application using localhost broker for testing and use the
default port number.

It should consume messages from the 'input_data' topic, where each message is a
JSON encoded object containing a single attribute: 'data'.

While consuming from the topic, increment the value of the data attribute by 1.

Finally, send message to the 'output_data' topic.
```

and run the following command to create a new **FastAgency** project:
``` shell
fastagency_gen -i description.txt
```

``` shell
✨  Generating a new FastAgency application!
 ✔ Application description validated.
 ✔ FastAgency app skeleton code generated. akes around 15 to 45 seconds)...
 ✔ The app and the tests are generated.  around 30 to 90 seconds)...
 ✔ New FastAgency project created.
 ✔ Integration tests were successfully completed.
 Tokens used: 10768
 Total Cost (USD): $0.03284
✨  All files were successfully generated!
```

### Tutorial

We also invite you to explore our tutorial, where we will guide you through the process of utilizing the [fastagency-gen](https://fastagency-gen.airt.ai) Python library to effortlessly create **FastAgency** applications:

- [Cryptocurrency analysis with FastAgency](https://fastagency-gen.airt.ai/Tutorial/Cryptocurrency_Tutorial/)

---

## Stay in touch

Please show your support and stay in touch by:

- giving our [GitHub repository](https://github.com/airtai/fastagency/) a star, and

- joining our [Discord server](https://discord.gg/qFm6aSqq59)

Your support helps us to stay in touch with you and encourages us to
continue developing and improving the framework. Thank you for your
support!

---

## Contributors

Thanks to all of these amazing people who made the project better!

<a href="https://github.com/airtai/fastagency/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=airtai/fastagency"/>
</a>
