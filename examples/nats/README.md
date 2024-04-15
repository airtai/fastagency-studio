# How to run?

1. First create jetstream subject by running 
   ```cmd
   python examples/nats/create_jetstream.py
   ```

2. Then start the backend script by running
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
