# twitch-chat-test-harness
Test harness for testing twitch skins

This is for the streamlabs obs widget.

## Notes

You can do special things for a user if you use the `data-from="user_nameHere"`

inside of `onEventRecieveHandler` you get an object containing the message. Some interesting paths from `detail`:
* `body` is the message
* `command` looks like the message id
* `from` looks like the ID of the user
* tags has a bunch of stuff
  * `mod`  is "0" for non mod
  * `subscriber` I think has the sub tier. "0" for non sub
  * `badges` have a bunch of stuff. It is a comma separated list
    * `vip/1` means they are a vip
    * `found/0` means they are a founder
    * `premium/1` is a prime
