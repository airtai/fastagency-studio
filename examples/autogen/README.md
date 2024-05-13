# How to run the examples/autogen

1. Open the fastagency repo using devcontainer

2. In a terminal switch to `examples/autogen` directory and start faststream by running the following command:
   ```cmd
   faststream run faststream_agent:app --workers 1
   ```

3. Then in the same `examples/autogen` directory, run the `client.py` script to send one message to autogen and to receive its response
   ```cmd
   python client.py
   ```
