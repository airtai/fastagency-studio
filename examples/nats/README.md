# How to run?

1. First create jetstream subject by running
   ```cmd
   python examples/nats/create_jetstream.py
   ```

2. Then start the faststream backend script by running
   ```cmd
   cd examples/nats
   faststream run faststream_backend:app --workers 2
   ```

   If you want to start nats-py backend then run(**not recommended**)
   ```cmd
   python examples/nats/backend.py
   ```

3. Finally serve the static file by cding into `examples/nats` and then starting python http server by
   ```cmd
   cd examples/nats
   ```

   ```cmd
   python -m http.server 8080
   ```

Finally open the following link in browser

http://localhost:8080/chat.html
