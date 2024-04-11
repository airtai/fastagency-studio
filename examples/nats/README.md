# How to run?

First create jetstream subject by running 
`python examples/nats/create_jetstream.py`

Then start the backend script by running
`python examples/nats/backend.py`

Finally serve the static file by cding into `examples/nats` and then starting python http server by

`cd examples/nats`

`python -m http.server 8080`

Finally open the following link in browser

http://localhost:8080/chat.html
