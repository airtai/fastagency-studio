# nats-chat

Example chat appliation using NATS with dynamic authorization.

## How to run

```
pnpm install
docker compose up -d
pnpm serve
```

# How to use

1. Goto http://localhost:3040/
2. Login with user/pass as bob/bob.
3. Open a second incognito browser window with the same URL to get a separate set of cookies.
4. Login with user/pass as alice/alice.
5. In Bob's browser, join the chat room #all1.
6. In Alice's browser, join the chat room #all1.
7. In Bob's browser send a message to chat room #all1.
8. In Alice's browser send a message to chat room #all1.
9. Verify that both users see each other messages in #all1.
10. In Bob's browser, try joining the room #alice1 and verify that it fails.
11. In Alices's browser, try joining the room #bob1 and verify that it fails.

## What is this?

This example is a chat application using NATS.
A user can login, join a chat room and then publish and subscribe to messages of that room.
The main point of the example is that the user can only join chat rooms to which he has been granted access.

In a real-world scenario there would be tens of thousends of chat rooms and the user may have access to several thousends of them.
This makes it impractical and inefficent to tell NATS all permissions that the user has up-front since they could get very large.
The permission are also highly dynamic, since the user at any time can be granted access to a new chat room (creating new rooms and granting access is not possible in this example yet but a usual part of real world chat applications).

Even if the user has access to thousends of chat rooms, he will only join a few of them for each session he uses the application.
We would want to tell NATS only about the permissions to the rooms that the user actually tries to join.
Say the user joins 10 rooms, then we need to tell NATS only about them.

The problem is we do not know at connection-time which rooms the user will want to join so we cannot provide that information at that point in time (in JWT issed by auth callout at connection time).
For this reason, each time a subscription attempt fails, we need to close the connection and re-connect, sending information about what chat rooms we want access to.
If the user currently has joined 3 rooms and want to join a 4th room that would initially fail becuase current JWT only has the 3 current rooms.
We disconnect from NATS and then connect again passing all 4 rooms.
The auth service now issues a new JWT with access to all requested rooms.

## Flow

This applications main purpose is to demonstrate this authentication and authorization flow:

1. User enters credentials (username, password) and posts it to HTTP backend.
2. HTTP backend validates the credentials (normally the backend would delegate authentication to an identity provider using eg. OIDC).
3. HTTP backend creates a cookie containing a token with username and a signature that can be validated later.
   - This example just includes a plain text signature but in a real-world scenario it would use the token issued by identity provider which is signed by the provider's public key.
4. The frontend connects to NATS server via websockets passing along the token from the cookie.
   - Ideally the cookie would be http-only and NATS supports this by the websocket.jwt_cookie setting. However this setting is currently blocked for use with auth callout because the NATS server validates this setting to only be used with some other trust settings that probably are not relevant for auth callout scenario).
5. The NATS server is configred for auth callout so it calls the auth service defined in the is example, passing along the token.
6. The auth service issues a JWT without any permissions.
7. The user tries to join a chat room.
8. The subscribe operation will return an error since the JWT currently active for the user at the NATS server does not conain permission for the room's subject.
9. The application catches the subscription permission error, disconnects from NATS, and then connects to NATS while passing all rooms to subscribe to in the `user` field of the connection request.
   - Ideally we would use the `client_info` field for this but I could not find a way to access this field from the `nats.ws` package.
10. The NATS server receives the new connection request and calls the auth service.
11. The auth service unpacks the `auth_token` and the `user` field in the connection request.
12. The subjects specified in `user` fields are compared to user permisions in JSON file and a new JWT is issued with all the requested subscriptions that the user has access to.
