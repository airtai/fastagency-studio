import { JSONCodec, connect, consumerOpts } from "../nats.js";
const me = Date.now();

window.chat = {
    send: send,
    exiting: exiting,
};

// create a decoder, the client is sending JSON
const jc = JSONCodec();

// create a connection, and register listeners
const init = async function () {
    const conn = await connect(
        { servers: "ws://localhost:9222" },
    );
    const js = conn.jetstream();

    const opts = consumerOpts();
    opts.orderedConsumer();
    // console.log(Object.getOwnPropertyNames(opts));

    for (var key in opts) {
        var value = opts[key];
        console.log(key, value);

    }

    // Assuming streams for 'chat', 'enter', and 'exit' have been created beforehand
    // For example, using NATS CLI: `nats stream add CHAT --subjects "chat.*" --storage memory`

    conn.closed().then((err) => {
        let m = "NATS connection closed";
        addEntry(`${m} ${err ? err.message : ""}`);
    });

    // Subscribe to chat messages
    const chatSub = await js.subscribe("chat.*", opts, { queue: "chat" });
    (async () => {
        for await (const m of chatSub) {
            const jm = jc.decode(m.data);
            // m.ack();
            addEntry(
                jm.id === me ? `(me): ${jm.m}` : `(${jm.id}): ${jm.m}`,
            );
        }
    })().then();

    // Subscribe to enter messages
    const enterSub = await js.subscribe("enter.*", opts, { queue: "enter" });
    (async () => {
        for await (const m of enterSub) {
            const jm = jc.decode(m.data);
            // m.ack();
            addEntry(`${jm.id} entered.`);
        }
    })().then();

    // Subscribe to exit messages
    const exitSub = await js.subscribe("exit.*", opts, { queue: "exit" });
    (async () => {
        for await (const m of exitSub) {
            const jm = jc.decode(m.data);
            // m.ack();
            if (jm.id !== me) {
                addEntry(`${jm.id} exited.`);
            }
        }
    })().then();


    // Subscribe to backend messages
    const backendSub = await js.subscribe("backend.*", opts, { queue: "backend" });
    (async () => {
        for await (const m of backendSub) {
            const jm = jc.decode(m.data);
            // m.ack();
            addEntry(
                jm.id === me ? `(me): ${jm.m}` : `(${jm.id}): ${jm.m}`,
            );
        }
    })().then();

    // Publish our enter message
    await js.publish(`enter.${me}`, jc.encode({ id: me }));

    return conn;
};

init().then((conn) => {
    window.nc = conn;
}).catch((ex) => {
    addEntry(`Error connecting to NATS: ${ex}`);
});

let input = document.getElementById("data");
input.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
        document.getElementById("send").click();
    } else {
        e.preventDefault();
    }
});

function send() {
    input = document.getElementById("data");
    const m = input.value;
    if (m !== "" && window.nc) {
        const subj = `chat.${me}`;
        console.log(`sending to ${subj}`);
        window.nc.jetstream().publish(subj, jc.encode({ id: me, m: m }));
        input.value = "";
    }
    return false;
}

function exiting() {
    if (window.nc) {
        window.nc.jetstream().publish(`exit.${me}`, jc.encode({ id: me }));
    }
}

function addEntry(s) {
    const p = document.createElement("pre");
    p.appendChild(document.createTextNode(s));
    document.getElementById("chats").appendChild(p);
}
