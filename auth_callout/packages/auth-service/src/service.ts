import * as Nats from "nats";
import * as Jwt from "nats-jwt";
import * as Nkeys from "nkeys.js";
import { fetchAuthToken, verifyAuthToken } from "./data";
import { AuthorizationRequestClaims } from "./types";

run();

async function run() {
  // const natsUrl = "nats://localhost:4228";
  // const natsUser = "auth";
  // const natsPass = "auth";
  // const issuerSeed = "SAANDLKMXL6CUS3CP52WIXBEDN6YJ545GDKC65U5JZPPV6WH6ESWUA6YAI";
  const natsUrl = "nats://kumaran-nats-py310-fastagency:4222"
  const natsUser = "auth";
  const natsPass = "auth";
  const issuerSeed = "SAALYZUPN235PN72VRMNHL26UQOMIFKLQANMFUAPQIAE5BXCS5X65WB4BI";

  var enc = new TextEncoder();
  var dec = new TextDecoder();

  // Parse the issuer account signing key.
  const issuerKeyPair = Nkeys.fromSeed(enc.encode(issuerSeed));

  // Open the NATS connection passing the auth account creds file.
  const nc = await Nats.connect({ servers: natsUrl, user: natsUser, pass: natsPass });

  // Start subscription
  const sub = nc.subscribe("$SYS.REQ.USER.AUTH");
  console.log(`listening for ${sub.getSubject()} requests...`);
  for await (const msg of sub) {
    console.log("Auth service got message");
    // console.log(msg)
    await msgHandler(msg, enc, dec, issuerKeyPair);
  }
}

async function msgHandler(req: Nats.Msg, enc: TextEncoder, dec: TextDecoder, issuerKeyPair: Nkeys.KeyPair) {
  // Helper function to construct an authorization response.
  const respondMsg = async (req: Nats.Msg, userNkey: string, serverId: string, userJwt: string, errMsg: string) => {
    let token: string;
    try {
      token = await Jwt.encodeAuthorizationResponse(userNkey, serverId, issuerKeyPair, { jwt: userJwt, error: errMsg }, {});
    } catch (err) {
      console.log("error encoding response JWT: %s", err);
      req.respond(undefined);
      return;
    }
    let data = enc.encode(token);
    req.respond(data);
  };

  // Check for Xkey header and decrypt
  let token: Uint8Array = req.data;

  // Decode the authorization request claims.
  let rc: AuthorizationRequestClaims;
  try {
    Jwt.encodeAuthorizationResponse;
    rc = Jwt.decode<AuthorizationRequestClaims>(dec.decode(token)) as AuthorizationRequestClaims;
  } catch (e) {
    return respondMsg(req, "", "", "", (e as Error).message);
  }

  // Used for creating the auth response.
  const userNkey = rc.nats.user_nkey;
  const serverId = rc.nats.server_id.id;

  const auth_user = rc.nats.connect_opts.user;
  const auth_pass = rc.nats.connect_opts.pass;

  // auth_user value is deployment_uuid, check authToken is not null
  const authToken = await fetchAuthToken(auth_user);
  if (!authToken) {
    return respondMsg(req, userNkey, serverId, "", "user " + auth_user + " not found");
  }

  const isPasswordCorrect = await verifyAuthToken(auth_pass, authToken.auth_token);
  if (!isPasswordCorrect) {
    return respondMsg(req, userNkey, serverId, "", "invalid credentials");
  }

  // const grantedRooms = [auth_user];
  const grantedRooms = ["alice"];
  // ToDo: Grant access to necessary rooms
  console.log(`Auth service user ${auth_user} granted permission to subjects: ${JSON.stringify(grantedRooms)}`);

  // User part of the JWT token to issue
  // Add "public" because if the allowed array is empty then all is allowed
  const user: Partial<Jwt.User> = { pub: { allow: ["public", ...grantedRooms], deny: [] }, sub: { allow: ["public", ...grantedRooms], deny: [] } };
  console.log(`Auth service permission: ${JSON.stringify(user)}`);
  // Prepare a user JWT.
  let ejwt: string;
  try {
    ejwt = await Jwt.encodeUser(rc.nats.connect_opts.user!, rc.nats.user_nkey, issuerKeyPair, user, { aud: "APP" });
  } catch (e) {
    console.log("error signing user JWT: %s", e);
    return respondMsg(req, userNkey, serverId, "", "error signing user JWT");
  }

  return respondMsg(req, userNkey, serverId, ejwt, "");
}
